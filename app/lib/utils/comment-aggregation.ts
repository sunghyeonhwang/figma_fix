/**
 * Comment Aggregation Utilities
 * Functions to organize and aggregate Figma comments by various dimensions
 */

import {
  CommentThread,
  AuthorStats,
  HourlyStats,
  DailyStats,
  WeeklyStats,
  ResolutionStats,
  CommentAggregation,
} from '../types/figma';

/**
 * Flattens comment threads into a single array including replies
 */
function flattenComments(threads: CommentThread[]): CommentThread[] {
  const result: CommentThread[] = [];

  function addComment(comment: CommentThread) {
    result.push(comment);
    for (const reply of comment.replies) {
      addComment(reply);
    }
  }

  for (const thread of threads) {
    addComment(thread);
  }

  return result;
}

/**
 * Gets the Monday of the week for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets the Sunday of the week for a given date
 */
function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

/**
 * Formats a date to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Aggregates comments by author
 */
export function aggregateByAuthor(threads: CommentThread[]): AuthorStats[] {
  const authorMap = new Map<string, AuthorStats>();
  const allComments = flattenComments(threads);

  for (const comment of allComments) {
    const authorId = comment.author.id;
    const isRootComment = comment.parentId === '';
    const isResolved = comment.isResolved;

    if (!authorMap.has(authorId)) {
      authorMap.set(authorId, {
        authorId,
        authorName: comment.author.name,
        avatarUrl: comment.author.avatarUrl,
        totalComments: 0,
        rootComments: 0,
        replies: 0,
        resolvedComments: 0,
        unresolvedComments: 0,
      });
    }

    const stats = authorMap.get(authorId)!;
    stats.totalComments++;

    if (isRootComment) {
      stats.rootComments++;
      // Resolution status is only tracked for root comments (threads)
      if (isResolved) {
        stats.resolvedComments++;
      } else {
        stats.unresolvedComments++;
      }
    } else {
      stats.replies++;
    }
  }

  // Sort by total comments (descending)
  return Array.from(authorMap.values()).sort(
    (a, b) => b.totalComments - a.totalComments
  );
}

/**
 * Aggregates comments by hour (0-23)
 */
export function aggregateByHour(threads: CommentThread[]): HourlyStats[] {
  // Initialize all 24 hours
  const hourStats: HourlyStats[] = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: 0,
    resolvedCount: 0,
    unresolvedCount: 0,
  }));

  const allComments = flattenComments(threads);

  for (const comment of allComments) {
    const date = new Date(comment.createdAt);
    const hour = date.getHours();

    hourStats[hour].count++;

    // Only count resolution status for root comments
    if (comment.parentId === '') {
      if (comment.isResolved) {
        hourStats[hour].resolvedCount++;
      } else {
        hourStats[hour].unresolvedCount++;
      }
    }
  }

  return hourStats;
}

/**
 * Aggregates comments by date
 */
export function aggregateByDate(threads: CommentThread[]): DailyStats[] {
  const dateMap = new Map<string, DailyStats>();
  const allComments = flattenComments(threads);

  for (const comment of allComments) {
    const date = new Date(comment.createdAt);
    const dateKey = formatDate(date);

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {
        date: dateKey,
        count: 0,
        resolvedCount: 0,
        unresolvedCount: 0,
        authors: [],
      });
    }

    const stats = dateMap.get(dateKey)!;
    stats.count++;

    // Track unique authors
    if (!stats.authors.includes(comment.author.id)) {
      stats.authors.push(comment.author.id);
    }

    // Only count resolution status for root comments
    if (comment.parentId === '') {
      if (comment.isResolved) {
        stats.resolvedCount++;
      } else {
        stats.unresolvedCount++;
      }
    }
  }

  // Sort by date (ascending)
  return Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Aggregates comments by week
 */
export function aggregateByWeek(threads: CommentThread[]): WeeklyStats[] {
  const weekMap = new Map<string, WeeklyStats>();
  const allComments = flattenComments(threads);

  for (const comment of allComments) {
    const date = new Date(comment.createdAt);
    const weekStart = getWeekStart(date);
    const weekEnd = getWeekEnd(date);
    const weekKey = formatDate(weekStart);

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        weekStart: formatDate(weekStart),
        weekEnd: formatDate(weekEnd),
        count: 0,
        resolvedCount: 0,
        unresolvedCount: 0,
      });
    }

    const stats = weekMap.get(weekKey)!;
    stats.count++;

    // Only count resolution status for root comments
    if (comment.parentId === '') {
      if (comment.isResolved) {
        stats.resolvedCount++;
      } else {
        stats.unresolvedCount++;
      }
    }
  }

  // Sort by week start date (ascending)
  return Array.from(weekMap.values()).sort(
    (a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
  );
}

/**
 * Calculates resolution statistics
 */
export function calculateResolutionStats(threads: CommentThread[]): ResolutionStats {
  const total = threads.length;
  const resolved = threads.filter((t) => t.isResolved).length;
  const unresolved = total - resolved;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Calculate average resolution time for resolved comments
  let totalResolutionTime = 0;
  let resolvedWithTimeCount = 0;

  for (const thread of threads) {
    if (thread.isResolved && thread.resolvedAt) {
      const createdTime = new Date(thread.createdAt).getTime();
      const resolvedTime = new Date(thread.resolvedAt).getTime();
      const resolutionTime = resolvedTime - createdTime;

      if (resolutionTime >= 0) {
        totalResolutionTime += resolutionTime;
        resolvedWithTimeCount++;
      }
    }
  }

  const averageResolutionTimeMs =
    resolvedWithTimeCount > 0
      ? Math.round(totalResolutionTime / resolvedWithTimeCount)
      : null;

  return {
    total,
    resolved,
    unresolved,
    resolutionRate,
    averageResolutionTimeMs,
  };
}

/**
 * Calculates time range of comments
 */
export function calculateTimeRange(threads: CommentThread[]): {
  earliest: string | null;
  latest: string | null;
  spanDays: number;
} {
  if (threads.length === 0) {
    return {
      earliest: null,
      latest: null,
      spanDays: 0,
    };
  }

  const allComments = flattenComments(threads);
  const timestamps = allComments.map((c) => new Date(c.createdAt).getTime());

  const earliest = Math.min(...timestamps);
  const latest = Math.max(...timestamps);

  const spanMs = latest - earliest;
  const spanDays = Math.ceil(spanMs / (1000 * 60 * 60 * 24));

  return {
    earliest: new Date(earliest).toISOString(),
    latest: new Date(latest).toISOString(),
    spanDays,
  };
}

/**
 * Generates complete aggregation statistics for comments
 */
export function aggregateComments(threads: CommentThread[]): CommentAggregation {
  return {
    overview: calculateResolutionStats(threads),
    byAuthor: aggregateByAuthor(threads),
    byHour: aggregateByHour(threads),
    byDate: aggregateByDate(threads),
    byWeek: aggregateByWeek(threads),
    timeRange: calculateTimeRange(threads),
  };
}

/**
 * Formats milliseconds to human-readable duration
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}일 ${hours % 24}시간`;
  }
  if (hours > 0) {
    return `${hours}시간 ${minutes % 60}분`;
  }
  if (minutes > 0) {
    return `${minutes}분`;
  }
  return `${seconds}초`;
}
