/**
 * Excel Export Utilities
 * Functions to export Figma comments to Excel format
 */

import * as XLSX from 'xlsx';
import { CommentThread, CommentAggregation } from '../types/figma';
import { getCategoryDefinition } from './comment-classification';

interface FileInfo {
  name: string;
  key: string;
  lastModified: string;
}

interface ExportData {
  fileInfo: FileInfo;
  comments: CommentThread[];
  aggregation?: CommentAggregation;
}

/**
 * Flattens comment threads into rows for Excel export
 */
function flattenCommentsForExport(threads: CommentThread[]): Array<{
  id: string;
  orderId: string;
  date: string;
  time: string;
  author: string;
  category: string;
  message: string;
  status: string;
  type: string;
  repliesCount: number;
  position: string;
}> {
  const rows: Array<{
    id: string;
    orderId: string;
    date: string;
    time: string;
    author: string;
    category: string;
    message: string;
    status: string;
    type: string;
    repliesCount: number;
    position: string;
  }> = [];

  function processComment(comment: CommentThread, isReply: boolean = false) {
    const createdAt = new Date(comment.createdAt);
    const dateStr = createdAt.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const timeStr = createdAt.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let positionStr = '-';
    if (comment.position) {
      if (comment.position.x !== undefined && comment.position.y !== undefined) {
        positionStr = `x: ${Math.round(comment.position.x)}, y: ${Math.round(comment.position.y)}`;
      } else if (comment.position.nodeId) {
        positionStr = `Node: ${comment.position.nodeId}`;
      }
    }

    rows.push({
      id: comment.id,
      orderId: comment.orderId ? String(comment.orderId) : '',
      date: dateStr,
      time: timeStr,
      author: comment.author.name,
      category: getCategoryDefinition(comment.category).label,
      message: comment.message,
      status: comment.isResolved ? '해결됨' : '미해결',
      type: isReply ? '답글' : '댓글',
      repliesCount: comment.replies.length,
      position: positionStr,
    });

    // Process replies
    for (const reply of comment.replies) {
      processComment(reply, true);
    }
  }

  for (const thread of threads) {
    processComment(thread);
  }

  return rows;
}

/**
 * Creates the Comments sheet data
 */
function createCommentsSheet(comments: CommentThread[]): XLSX.WorkSheet {
  const rows = flattenCommentsForExport(comments);

  const data = [
    ['댓글 번호', 'ID', '날짜', '시간', '작성자', '분류', '내용', '상태', '유형', '답글 수', '위치'],
    ...rows.map(row => [
      row.orderId,
      row.id,
      row.date,
      row.time,
      row.author,
      row.category,
      row.message,
      row.status,
      row.type,
      row.repliesCount,
      row.position,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 12 },  // Comment order
    { wch: 20 },  // ID
    { wch: 12 },  // Date
    { wch: 8 },   // Time
    { wch: 15 },  // Author
    { wch: 12 },  // Category
    { wch: 50 },  // Message
    { wch: 10 },  // Status
    { wch: 8 },   // Type
    { wch: 8 },   // Replies
    { wch: 20 },  // Position
  ];

  return ws;
}

/**
 * Creates the Summary sheet data
 */
function createSummarySheet(
  fileInfo: FileInfo,
  comments: CommentThread[],
  aggregation?: CommentAggregation
): XLSX.WorkSheet {
  const totalCount = comments.length;
  const resolvedCount = comments.filter(c => c.isResolved).length;
  const unresolvedCount = totalCount - resolvedCount;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  // Count total including replies
  let totalWithReplies = 0;
  function countAll(thread: CommentThread) {
    totalWithReplies++;
    for (const reply of thread.replies) {
      countAll(reply);
    }
  }
  comments.forEach(countAll);

  const data = [
    ['Figma 파일 댓글 리포트'],
    [],
    ['파일 정보'],
    ['파일명', fileInfo.name],
    ['파일 키', fileInfo.key],
    ['마지막 수정', new Date(fileInfo.lastModified).toLocaleString('ko-KR')],
    [],
    ['댓글 통계'],
    ['전체 스레드 수', totalCount],
    ['전체 댓글 수 (답글 포함)', totalWithReplies],
    ['해결된 스레드', resolvedCount],
    ['미해결 스레드', unresolvedCount],
    ['해결률', `${resolutionRate}%`],
  ];

  // Add time range if aggregation is available
  if (aggregation?.timeRange) {
    data.push([]);
    data.push(['기간 정보']);
    if (aggregation.timeRange.earliest) {
      data.push(['첫 댓글', new Date(aggregation.timeRange.earliest).toLocaleString('ko-KR')]);
    }
    if (aggregation.timeRange.latest) {
      data.push(['마지막 댓글', new Date(aggregation.timeRange.latest).toLocaleString('ko-KR')]);
    }
    data.push(['기간 (일)', aggregation.timeRange.spanDays]);
  }

  // Add average resolution time if available
  if (aggregation?.overview.averageResolutionTimeMs) {
    const avgMs = aggregation.overview.averageResolutionTimeMs;
    const avgHours = Math.round(avgMs / (1000 * 60 * 60) * 10) / 10;
    data.push(['평균 해결 시간', `${avgHours}시간`]);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 25 },
    { wch: 40 },
  ];

  return ws;
}

/**
 * Creates the By Author sheet data
 */
function createByAuthorSheet(aggregation: CommentAggregation): XLSX.WorkSheet {
  const data = [
    ['작성자별 통계'],
    [],
    ['작성자', '전체 댓글', '스레드', '답글', '해결됨', '미해결'],
    ...aggregation.byAuthor.map(author => [
      author.authorName,
      author.totalComments,
      author.rootComments,
      author.replies,
      author.resolvedComments,
      author.unresolvedComments,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
  ];

  return ws;
}

/**
 * Creates the By Date sheet data
 */
function createByDateSheet(aggregation: CommentAggregation): XLSX.WorkSheet {
  const data = [
    ['날짜별 통계'],
    [],
    ['날짜', '댓글 수', '해결됨', '미해결', '작성자 수'],
    ...aggregation.byDate.map(day => [
      day.date,
      day.count,
      day.resolvedCount,
      day.unresolvedCount,
      day.authors.length,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
  ];

  return ws;
}

/**
 * Exports comments data to Excel file and triggers download
 */
export function exportToExcel(data: ExportData): void {
  const { fileInfo, comments, aggregation } = data;

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Add Summary sheet
  const summarySheet = createSummarySheet(fileInfo, comments, aggregation);
  XLSX.utils.book_append_sheet(wb, summarySheet, '요약');

  // Add Comments sheet
  const commentsSheet = createCommentsSheet(comments);
  XLSX.utils.book_append_sheet(wb, commentsSheet, '댓글 목록');

  // Add By Author sheet if aggregation is available
  if (aggregation) {
    const byAuthorSheet = createByAuthorSheet(aggregation);
    XLSX.utils.book_append_sheet(wb, byAuthorSheet, '작성자별');

    // Add By Date sheet
    const byDateSheet = createByDateSheet(aggregation);
    XLSX.utils.book_append_sheet(wb, byDateSheet, '날짜별');
  }

  // Generate filename
  const sanitizedFileName = fileInfo.name.replace(/[^a-zA-Z0-9가-힣\s]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${sanitizedFileName}_댓글_${dateStr}.xlsx`;

  // Trigger download
  XLSX.writeFile(wb, fileName);
}
