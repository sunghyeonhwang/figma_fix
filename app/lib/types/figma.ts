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
  parent_id?: string | null;
  user: FigmaUser;
  created_at: string;
  resolved_at: string | null;
  message: string;
  client_meta: FigmaClientMeta | null;
  order_id?: number | string | null;
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
  orderId?: number | string | null;
  parentId: string | null;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  message: string;
  messageMd?: string;
  createdAt: string;
  resolvedAt: string | null;
  isResolved: boolean;
  position: {
    x?: number;
    y?: number;
    nodeId?: string;
  } | null;
  category?: CommentCategoryId;
  categoryLabel?: string;
  categoryConfidence?: number;
  categoryReasons?: string[];
  replies: CommentThread[];
}

export type CommentCategoryId =
  | 'typo'
  | 'spacing'
  | 'copy'
  | 'function_error'
  | 'change_request'
  | 'design_ui'
  | 'link_button'
  | 'schedule_info'
  | 'other';

export interface CommentCategoryDefinition {
  id: CommentCategoryId;
  label: string;
  description: string;
}

export interface CommentsApiResponse {
  success: boolean;
  data?: {
    fileInfo: {
      name: string;
      key: string;
      url?: string;
      nodeId?: string;
      lastModified: string;
    };
    comments: CommentThread[];
    totalCount: number;
    resolvedCount: number;
    unresolvedCount: number;
    runId?: string | null;
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

// ============================================
// Comment Aggregation Types
// ============================================

// Author statistics
export interface AuthorStats {
  authorId: string;
  authorName: string;
  avatarUrl: string;
  totalComments: number;
  rootComments: number;
  replies: number;
  resolvedComments: number;
  unresolvedComments: number;
}

// Hourly aggregation (0-23)
export interface HourlyStats {
  hour: number; // 0-23
  count: number;
  resolvedCount: number;
  unresolvedCount: number;
}

// Daily aggregation
export interface DailyStats {
  date: string; // YYYY-MM-DD format
  count: number;
  resolvedCount: number;
  unresolvedCount: number;
  authors: string[]; // unique author IDs for that day
}

// Weekly aggregation
export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD (Monday of the week)
  weekEnd: string; // YYYY-MM-DD (Sunday of the week)
  count: number;
  resolvedCount: number;
  unresolvedCount: number;
}

// Resolution status stats
export interface ResolutionStats {
  total: number;
  resolved: number;
  unresolved: number;
  resolutionRate: number; // percentage 0-100
  averageResolutionTimeMs: number | null; // average time to resolve in milliseconds
}

// Complete aggregated statistics
export interface CommentAggregation {
  overview: ResolutionStats;
  byAuthor: AuthorStats[];
  byHour: HourlyStats[];
  byDate: DailyStats[];
  byWeek: WeeklyStats[];
  timeRange: {
    earliest: string | null; // ISO date string
    latest: string | null; // ISO date string
    spanDays: number;
  };
}

// Extended API response with aggregations
export interface CommentsApiResponseWithAggregation extends CommentsApiResponse {
  data?: CommentsApiResponse['data'] & {
    aggregation: CommentAggregation;
  };
}
