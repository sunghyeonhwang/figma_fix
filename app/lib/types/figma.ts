/**
 * Figma API Types
 * Based on Figma REST API v1 documentation
 */

// User information from Figma
export interface FigmaUser {
  id: string;
  handle: string;
  img_url: string;
  email?: string;
}

// Client metadata for comments
export interface FigmaClientMeta {
  x?: number;
  y?: number;
  node_id?: string;
  node_offset?: {
    x: number;
    y: number;
  };
}

// Individual comment from Figma
export interface FigmaComment {
  id: string;
  uuid?: string;
  file_key: string;
  parent_id: string;
  user: FigmaUser;
  created_at: string;
  resolved_at: string | null;
  message: string;
  client_meta: FigmaClientMeta | null;
  order_id: string;
}

// Response from Figma GET /v1/files/:file_key/comments
export interface FigmaCommentsResponse {
  comments: FigmaComment[];
}

// Figma file information
export interface FigmaFileInfo {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
}

// Response from Figma GET /v1/files/:file_key (minimal)
export interface FigmaFileResponse {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
}

// Parsed Figma URL information
export interface ParsedFigmaUrl {
  fileKey: string;
  fileType: 'file' | 'design' | 'proto' | 'board';
  nodeId?: string;
}

// API Response types for our backend
export interface CommentThread {
  id: string;
  parentId: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  message: string;
  createdAt: string;
  resolvedAt: string | null;
  isResolved: boolean;
  position: {
    x?: number;
    y?: number;
    nodeId?: string;
  } | null;
  replies: CommentThread[];
}

export interface CommentsApiResponse {
  success: boolean;
  data?: {
    fileInfo: {
      name: string;
      key: string;
      lastModified: string;
    };
    comments: CommentThread[];
    totalCount: number;
    resolvedCount: number;
    unresolvedCount: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Error codes
export enum FigmaErrorCode {
  INVALID_URL = 'INVALID_URL',
  INVALID_TOKEN = 'INVALID_TOKEN',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  ACCESS_DENIED = 'ACCESS_DENIED',
  RATE_LIMITED = 'RATE_LIMITED',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}
