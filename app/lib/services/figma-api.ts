import {
  FigmaComment,
  FigmaCommentsResponse,
  FigmaFileResponse,
  FigmaErrorCode,
  CommentThread,
  CommentPageInfo,
  FigmaNode,
} from '../types/figma';

/**
 * Figma API Service
 * Handles all communication with the Figma REST API
 */

const FIGMA_API_BASE = 'https://api.figma.com/v1';

interface FigmaApiError {
  code: FigmaErrorCode;
  message: string;
  status?: number;
}

class FigmaApiService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Makes an authenticated request to the Figma API
   */
  private async request<T>(endpoint: string): Promise<T> {
    const url = `${FIGMA_API_BASE}${endpoint}`;
    const authHeaders: Record<string, string> =
      this.accessToken.startsWith("figd_") || this.accessToken.startsWith("figpat-")
        ? { "X-Figma-Token": this.accessToken }
        : { Authorization: `Bearer ${this.accessToken}` };

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw this.handleApiError(response.status, await response.text());
    }

    return response.json();
  }

  /**
   * Handles API errors and returns appropriate error objects
   */
  private handleApiError(status: number, body: string): FigmaApiError {
    switch (status) {
      case 401:
        return {
          code: FigmaErrorCode.INVALID_TOKEN,
          message: '유효하지 않은 Figma 액세스 토큰입니다.',
          status,
        };
      case 403:
        return {
          code: FigmaErrorCode.ACCESS_DENIED,
          message: '이 파일에 접근할 권한이 없습니다.',
          status,
        };
      case 404:
        return {
          code: FigmaErrorCode.FILE_NOT_FOUND,
          message: '파일을 찾을 수 없습니다. URL을 확인해주세요.',
          status,
        };
      case 429:
        return {
          code: FigmaErrorCode.RATE_LIMITED,
          message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          status,
        };
      default:
        return {
          code: FigmaErrorCode.API_ERROR,
          message: `Figma API 오류가 발생했습니다: ${body}`,
          status,
        };
    }
  }

  /**
   * Fetches file information from Figma
   */
  async getFileInfo(fileKey: string): Promise<FigmaFileResponse> {
    // We only need basic file info, so we use depth=1 to minimize response
    const response = await this.request<FigmaFileResponse>(`/files/${fileKey}?depth=1`);

    return {
      name: response.name,
      lastModified: response.lastModified,
      thumbnailUrl: response.thumbnailUrl,
      version: response.version,
      document: response.document,
    };
  }

  /**
   * Fetches a subset of a Figma file around specific node ids.
   */
  async getFileNodeAncestors(fileKey: string, nodeIds: string[]): Promise<FigmaFileResponse[]> {
    const chunks = chunkArray([...new Set(nodeIds)].filter(Boolean), 100);
    const responses: FigmaFileResponse[] = [];

    for (const chunk of chunks) {
      if (chunk.length === 0) continue;
      const encodedIds = chunk.map((id) => encodeURIComponent(id)).join(',');
      const response = await this.request<FigmaFileResponse>(
        `/files/${fileKey}?ids=${encodedIds}`
      );

      responses.push(response);
    }

    return responses;
  }

  /**
   * Resolves comment node ids to their containing top-level Figma pages.
   */
  async getCommentPageMap(
    fileKey: string,
    comments: FigmaComment[],
    pageOrderById: Map<string, number> = new Map()
  ): Promise<Map<string, CommentPageInfo>> {
    const nodeIds = comments
      .map((comment) => comment.client_meta?.node_id)
      .filter((nodeId): nodeId is string => !!nodeId);

    if (nodeIds.length === 0) {
      return new Map();
    }

    const responses = await this.getFileNodeAncestors(fileKey, nodeIds);
    const pageByNodeId = new Map<string, CommentPageInfo>();

    for (const response of responses) {
      mergePageLookup(response.document, pageByNodeId, pageOrderById);
    }

    return pageByNodeId;
  }

  /**
   * Fetches all comments for a Figma file
   */
  async getComments(fileKey: string): Promise<FigmaCommentsResponse> {
    return this.request<FigmaCommentsResponse>(`/files/${fileKey}/comments?as_md=true`);
  }

  /**
   * Organizes flat comments into threaded structure
   */
  organizeCommentsIntoThreads(
    comments: FigmaComment[],
    pageByNodeId: Map<string, CommentPageInfo> = new Map()
  ): CommentThread[] {
    // Create a map of comment id to comment
    const commentMap = new Map<string, FigmaComment>();
    const rootComments: FigmaComment[] = [];
    const childComments: FigmaComment[] = [];

    // First pass: categorize comments
    for (const comment of comments) {
      commentMap.set(comment.id, comment);
      if (!comment.parent_id) {
        rootComments.push(comment);
      } else {
        childComments.push(comment);
      }
    }

    // Convert a FigmaComment to CommentThread
    const toCommentThread = (comment: FigmaComment): CommentThread => {
      const nodeId = comment.client_meta?.node_id;

      return {
        id: comment.id,
        orderId: comment.order_id,
        parentId: comment.parent_id || null,
        author: {
          id: comment.user.id,
          name: comment.user.handle,
          avatarUrl: comment.user.img_url,
        },
        message: comment.message,
        messageMd: comment.message,
        createdAt: comment.created_at,
        resolvedAt: comment.resolved_at,
        isResolved: comment.resolved_at !== null,
        position: comment.client_meta
          ? {
              x: comment.client_meta.x,
              y: comment.client_meta.y,
              nodeId,
            }
          : null,
        page: nodeId ? getPageForNodeId(pageByNodeId, nodeId) : null,
        replies: [],
      };
    };

    // Build thread structure
    const threads: CommentThread[] = [];
    const threadMap = new Map<string, CommentThread>();

    // Create threads from root comments
    for (const rootComment of rootComments) {
      const thread = toCommentThread(rootComment);
      threads.push(thread);
      threadMap.set(rootComment.id, thread);
    }

    // Add replies to their parent threads
    // Sort child comments by creation date to maintain order
    childComments.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    for (const childComment of childComments) {
      if (!childComment.parent_id) continue;
      const parentThread = threadMap.get(childComment.parent_id);
      if (parentThread) {
        const childThread = toCommentThread(childComment);
        childThread.page = childThread.page ?? parentThread.page ?? null;
        parentThread.replies.push(childThread);
        threadMap.set(childComment.id, childThread);
      }
    }

    // Sort threads by creation date (newest first)
    threads.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return threads;
  }

  /**
   * Gets comments with file info and organized into threads
   */
  async getCommentsWithFileInfo(fileKey: string): Promise<{
    fileInfo: FigmaFileResponse;
    threads: CommentThread[];
    stats: {
      total: number;
      resolved: number;
      unresolved: number;
    };
  }> {
    // Fetch file info and comments in parallel
    const [fileInfo, commentsResponse] = await Promise.all([
      this.getFileInfo(fileKey),
      this.getComments(fileKey),
    ]);

    const pageByNodeId = await this.getCommentPageMap(
      fileKey,
      commentsResponse.comments,
      getTopLevelPageOrder(fileInfo.document)
    );
    const threads = this.organizeCommentsIntoThreads(commentsResponse.comments, pageByNodeId);

    // Calculate stats
    const resolvedCount = threads.filter((t) => t.isResolved).length;

    return {
      fileInfo,
      threads,
      stats: {
        total: threads.length,
        resolved: resolvedCount,
        unresolved: threads.length - resolvedCount,
      },
    };
  }
}

/**
 * Creates a new FigmaApiService instance with the provided access token
 */
export function createFigmaApiService(accessToken: string): FigmaApiService {
  if (!accessToken || accessToken.trim() === '') {
    throw {
      code: FigmaErrorCode.INVALID_TOKEN,
      message: 'Figma 액세스 토큰이 필요합니다.',
    } as FigmaApiError;
  }

  return new FigmaApiService(accessToken);
}

/**
 * Gets the Figma access token from environment variables
 */
export function getFigmaAccessToken(): string | null {
  return process.env.FIGMA_ACCESS_TOKEN || null;
}

export { FigmaApiService };
export type { FigmaApiError };

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function mergePageLookup(
  document: FigmaNode | undefined,
  pageByNodeId: Map<string, CommentPageInfo>,
  pageOrderById: Map<string, number>
) {
  if (!document?.children) return;

  document.children.forEach((page, index) => {
    const pageInfo: CommentPageInfo = {
      id: page.id,
      name: page.name,
      order: pageOrderById.get(page.id) ?? index,
    };

    mapNodeToPage(pageByNodeId, page, pageInfo);
  });
}

function mapNodeToPage(
  pageByNodeId: Map<string, CommentPageInfo>,
  node: FigmaNode,
  page: CommentPageInfo
) {
  addNodeIdAliases(pageByNodeId, node.id, page);

  for (const child of node.children ?? []) {
    mapNodeToPage(pageByNodeId, child, page);
  }
}

function addNodeIdAliases(
  pageByNodeId: Map<string, CommentPageInfo>,
  nodeId: string,
  page: CommentPageInfo
) {
  pageByNodeId.set(nodeId, page);
  pageByNodeId.set(nodeId.replace(/:/g, '-'), page);
}

function getPageForNodeId(
  pageByNodeId: Map<string, CommentPageInfo>,
  nodeId: string
): CommentPageInfo | null {
  const normalizedNodeId = nodeId.replace(/-/g, ':');
  const instanceNodeId = normalizedNodeId.includes(';')
    ? normalizedNodeId.split(';').at(-1)
    : null;

  return (
    pageByNodeId.get(nodeId) ??
    pageByNodeId.get(normalizedNodeId) ??
    (instanceNodeId ? pageByNodeId.get(instanceNodeId) : undefined) ??
    null
  );
}

function getTopLevelPageOrder(document: FigmaNode | undefined) {
  const pageOrderById = new Map<string, number>();

  document?.children?.forEach((page, index) => {
    pageOrderById.set(page.id, index);
  });

  return pageOrderById;
}
