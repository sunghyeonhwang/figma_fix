import { CommentAggregation, CommentCategoryId, CommentThread } from "../types/figma";
import { COMMENT_CATEGORIES, getCategoryDefinition } from "./comment-classification";

interface FileInfo {
  name: string;
  key: string;
  url?: string;
  nodeId?: string;
  lastModified: string;
}

interface MarkdownExportData {
  fileInfo: FileInfo;
  comments: CommentThread[];
  aggregation?: CommentAggregation;
  categoryFilter?: CommentCategoryId | "all";
  includeResolved?: boolean;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCommentAnchor(fileInfo: FileInfo, comment: CommentThread) {
  if (!fileInfo.url) return null;

  try {
    const url = new URL(fileInfo.url);
    if (comment.position?.nodeId) {
      url.searchParams.set("node-id", comment.position.nodeId.replace(/:/g, "-"));
    }
    return url.toString();
  } catch {
    return fileInfo.url;
  }
}

function positionToText(comment: CommentThread) {
  if (comment.position?.nodeId) {
    return `Node: ${comment.position.nodeId}`;
  }

  if (comment.position?.x !== undefined && comment.position?.y !== undefined) {
    return `x:${Math.round(comment.position.x)}, y:${Math.round(comment.position.y)}`;
  }

  return "-";
}

function sanitizeMarkdownText(text: string) {
  return text.trim().replace(/\n{3,}/g, "\n\n");
}

function appendComment(lines: string[], fileInfo: FileInfo, comment: CommentThread, index: number) {
  const category = getCategoryDefinition(comment.category);
  const figmaLink = getCommentAnchor(fileInfo, comment);

  lines.push(`### ${index}. ${comment.orderId ? `Comment #${comment.orderId}` : comment.id}`);
  lines.push("");
  lines.push(`- 분류: ${category.label}`);
  lines.push(`- 상태: ${comment.isResolved ? "해결됨" : "미해결"}`);
  lines.push(`- 작성자: ${comment.author.name}`);
  lines.push(`- 작성일: ${formatDateTime(comment.createdAt)}`);
  lines.push(`- 위치: ${positionToText(comment)}`);
  if (figmaLink) {
    lines.push(`- Figma: ${figmaLink}`);
  }
  if (comment.categoryReasons?.length) {
    lines.push(`- 분류 근거: ${comment.categoryReasons.join(", ")}`);
  }
  lines.push("");
  lines.push("원문:");
  lines.push("");
  lines.push("> " + sanitizeMarkdownText(comment.messageMd || comment.message).replace(/\n/g, "\n> "));

  if (comment.replies.length > 0) {
    lines.push("");
    lines.push("답글:");
    for (const reply of comment.replies) {
      lines.push("");
      lines.push(`- ${reply.author.name} (${formatDateTime(reply.createdAt)})`);
      lines.push(`  > ${sanitizeMarkdownText(reply.messageMd || reply.message).replace(/\n/g, "\n  > ")}`);
    }
  }

  lines.push("");
}

export function generateMarkdownReport({
  fileInfo,
  comments,
  aggregation,
  categoryFilter = "all",
  includeResolved = true,
}: MarkdownExportData) {
  const filtered = comments.filter((comment) => {
    const matchesCategory = categoryFilter === "all" || comment.category === categoryFilter;
    const matchesResolved = includeResolved || !comment.isResolved;
    return matchesCategory && matchesResolved;
  });

  const lines: string[] = [
    `# ${fileInfo.name} - Figma Comment Review`,
    "",
    `- 파일 키: ${fileInfo.key}`,
    `- Figma URL: ${fileInfo.url || "-"}`,
    `- 선택 노드: ${fileInfo.nodeId || "-"}`,
    `- 마지막 수정: ${formatDateTime(fileInfo.lastModified)}`,
    `- 내보낸 시각: ${formatDateTime(new Date().toISOString())}`,
    `- 총 스레드: ${filtered.length}`,
  ];

  if (aggregation) {
    lines.push(`- 전체 해결률: ${aggregation.overview.resolutionRate}%`);
  }

  lines.push("");
  lines.push("## 분류 요약");
  lines.push("");

  for (const category of COMMENT_CATEGORIES) {
    const count = filtered.filter((comment) => comment.category === category.id).length;
    if (count > 0) {
      lines.push(`- ${category.label}: ${count}`);
    }
  }

  if (filtered.length === 0) {
    lines.push("- 내보낼 코멘트가 없습니다.");
  }

  for (const category of COMMENT_CATEGORIES) {
    const categoryComments = filtered.filter((comment) => comment.category === category.id);
    if (categoryComments.length === 0) continue;

    lines.push("");
    lines.push(`## ${category.label}`);
    lines.push("");

    categoryComments.forEach((comment, index) => {
      appendComment(lines, fileInfo, comment, index + 1);
    });
  }

  return `${lines.join("\n").trim()}\n`;
}

export function downloadMarkdownReport(data: MarkdownExportData) {
  const markdown = generateMarkdownReport(data);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const safeName = data.fileInfo.name.replace(/[^a-zA-Z0-9가-힣_-]+/g, "_");
  const date = new Date().toISOString().split("T")[0];
  const suffix =
    data.categoryFilter && data.categoryFilter !== "all"
      ? `_${getCategoryDefinition(data.categoryFilter).label}`
      : "";
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `${safeName}_comments${suffix}_${date}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
