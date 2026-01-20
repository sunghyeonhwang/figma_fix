import { NextRequest, NextResponse } from 'next/server';
import { createFigmaApiService, getFigmaAccessToken, FigmaApiError } from '@/app/lib/services/figma-api';
import { parseFigmaUrl, isValidFigmaUrl } from '@/app/lib/utils/figma-url';
import { aggregateComments } from '@/app/lib/utils/comment-aggregation';
import { CommentsApiResponseWithAggregation, FigmaErrorCode } from '@/app/lib/types/figma';

/**
 * POST /api/figma/comments
 * Fetches comments from a Figma file
 *
 * Request body:
 * {
 *   "url": "https://www.figma.com/file/xxx/..."
 *   "accessToken"?: "figd_xxx" // Optional, uses server token if not provided
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse<CommentsApiResponseWithAggregation>> {
  try {
    // Parse request body
    const body = await request.json();
    const { url, accessToken: clientToken } = body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FigmaErrorCode.INVALID_URL,
            message: 'Figma URL이 필요합니다.',
          },
        },
        { status: 400 }
      );
    }

    if (!isValidFigmaUrl(url)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FigmaErrorCode.INVALID_URL,
            message: '유효하지 않은 Figma URL입니다. 올바른 Figma 파일 링크를 입력해주세요.',
          },
        },
        { status: 400 }
      );
    }

    // Parse the URL to get file key
    const parsedUrl = parseFigmaUrl(url);
    if (!parsedUrl) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FigmaErrorCode.INVALID_URL,
            message: 'URL에서 파일 키를 추출할 수 없습니다.',
          },
        },
        { status: 400 }
      );
    }

    // Get access token (client-provided or server environment variable)
    const accessToken = clientToken || getFigmaAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FigmaErrorCode.INVALID_TOKEN,
            message: 'Figma 액세스 토큰이 설정되지 않았습니다. 환경 변수를 확인해주세요.',
          },
        },
        { status: 401 }
      );
    }

    // Create Figma API service and fetch comments
    const figmaService = createFigmaApiService(accessToken);
    const result = await figmaService.getCommentsWithFileInfo(parsedUrl.fileKey);

    // Generate aggregated statistics
    const aggregation = aggregateComments(result.threads);

    // Return successful response with aggregation data
    return NextResponse.json({
      success: true,
      data: {
        fileInfo: {
          name: result.fileInfo.name,
          key: parsedUrl.fileKey,
          lastModified: result.fileInfo.lastModified,
        },
        comments: result.threads,
        totalCount: result.stats.total,
        resolvedCount: result.stats.resolved,
        unresolvedCount: result.stats.unresolved,
        aggregation,
      },
    });
  } catch (error) {
    // Handle known Figma API errors
    if (error && typeof error === 'object' && 'code' in error) {
      const figmaError = error as FigmaApiError;
      const statusMap: Record<string, number> = {
        [FigmaErrorCode.INVALID_TOKEN]: 401,
        [FigmaErrorCode.ACCESS_DENIED]: 403,
        [FigmaErrorCode.FILE_NOT_FOUND]: 404,
        [FigmaErrorCode.RATE_LIMITED]: 429,
      };

      return NextResponse.json(
        {
          success: false,
          error: {
            code: figmaError.code,
            message: figmaError.message,
          },
        },
        { status: statusMap[figmaError.code] || 500 }
      );
    }

    // Handle network or other errors
    console.error('Unexpected error fetching Figma comments:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: FigmaErrorCode.NETWORK_ERROR,
          message: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/figma/comments
 * Returns information about the API endpoint
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Figma Comments API',
    usage: {
      method: 'POST',
      body: {
        url: 'Figma file URL (required)',
        accessToken: 'Figma access token (optional, uses server token if not provided)',
      },
    },
    documentation: 'https://www.figma.com/developers/api#comments',
  });
}
