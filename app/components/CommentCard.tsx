"use client";

import { useState } from "react";
import { CommentThread } from "../lib/types/figma";
import { getCategoryDefinition } from "../lib/utils/comment-classification";

interface CommentCardProps {
  comment: CommentThread;
  isReply?: boolean;
}

export function CommentCard({ comment, isReply = false }: CommentCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasReplies = comment.replies && comment.replies.length > 0;
  const category = getCategoryDefinition(comment.category);

  return (
    <div
      className={`group ${
        isReply
          ? ""
          : `rounded-xl border transition-all duration-200 ${
              comment.isResolved
                ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50/50 dark:border-green-800/50 dark:from-green-900/20 dark:to-emerald-900/10"
                : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md dark:border-zinc-700/80 dark:bg-zinc-900 dark:hover:border-zinc-600"
            }`
      }`}
    >
      <div className={isReply ? "" : "p-4"}>
        {/* Comment Header */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {comment.author.avatarUrl ? (
              <img
                src={comment.author.avatarUrl}
                alt={comment.author.name}
                className={`rounded-full ring-2 ring-white dark:ring-zinc-800 ${
                  isReply ? "h-7 w-7" : "h-10 w-10"
                }`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={`${comment.author.avatarUrl ? "hidden" : "flex"} items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-medium ${
                isReply ? "h-7 w-7 text-xs" : "h-10 w-10 text-sm"
              }`}
            >
              {comment.author.name.charAt(0).toUpperCase()}
            </div>
            {/* Online indicator for non-replies */}
            {!isReply && (
              <div
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-800 ${
                  comment.isResolved ? "bg-green-500" : "bg-purple-500"
                }`}
              />
            )}
          </div>

          {/* Author Info & Message */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-semibold text-zinc-900 dark:text-white ${
                  isReply ? "text-sm" : "text-base"
                }`}
              >
                {comment.author.name}
              </span>
              <span
                className={`text-zinc-400 dark:text-zinc-500 ${
                  isReply ? "text-xs" : "text-sm"
                }`}
                title={formatFullDate(comment.createdAt)}
              >
                {formatTime(comment.createdAt)}
              </span>
              {!isReply && comment.orderId && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  #{comment.orderId}
                </span>
              )}
              {!isReply && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getCategoryClasses(comment.category)}`}>
                  {category.label}
                </span>
              )}
              {comment.isResolved && !isReply && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-400">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  해결됨
                </span>
              )}
            </div>

            {/* Message */}
            <div
              className={`mt-2 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words leading-relaxed ${
                isReply ? "text-sm" : "text-base"
              }`}
            >
              {comment.message}
            </div>

            {/* Position indicator (if available) */}
            {!isReply && comment.position && (comment.position.x !== undefined || comment.position.nodeId) && (
              <div className="mt-2 flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>
                  {comment.position.nodeId
                    ? `Node: ${comment.position.nodeId}`
                    : `위치: (${Math.round(comment.position.x || 0)}, ${Math.round(comment.position.y || 0)})`}
                </span>
              </div>
            )}
          </div>

          {/* Expand/Collapse for replies */}
          {hasReplies && !isReply && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              aria-label={isExpanded ? "답글 접기" : "답글 펼치기"}
            >
              <svg
                className={`h-5 w-5 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Replies */}
        {hasReplies && isExpanded && (
          <div className="mt-4 space-y-3 border-l-2 border-purple-200 pl-4 dark:border-purple-800/50">
            <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
              <span>{comment.replies.length}개의 답글</span>
            </div>
            {comment.replies.map((reply) => (
              <CommentCard key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getCategoryClasses(categoryId: CommentThread["category"]) {
  switch (categoryId) {
    case "typo":
      return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300";
    case "spacing":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
    case "copy":
      return "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300";
    case "function_error":
      return "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300";
    case "change_request":
      return "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300";
    case "design_ui":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300";
    case "link_button":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
    case "schedule_info":
      return "bg-lime-100 text-lime-700 dark:bg-lime-950/50 dark:text-lime-300";
    default:
      return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
  }
}
