"use client";

import { useState } from "react";
import { CommentThread, CommentAggregation, CommentCategoryId } from "../lib/types/figma";
import { CommentsList } from "./CommentsList";
import { StatsDashboard } from "./StatsDashboard";
import { exportToExcel } from "../lib/utils/excel-export";
import { COMMENT_CATEGORIES } from "../lib/utils/comment-classification";
import { downloadMarkdownReport } from "../lib/utils/markdown-export";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

interface FileInfo {
  name: string;
  key: string;
  url?: string;
  nodeId?: string;
  lastModified: string;
}

interface ResultsViewProps {
  fileInfo: FileInfo;
  comments: CommentThread[];
  totalCount: number;
  resolvedCount: number;
  unresolvedCount: number;
  aggregation?: CommentAggregation;
  runId?: string | null;
  onBack: () => void;
}

export function ResultsView({
  fileInfo,
  comments,
  totalCount,
  resolvedCount,
  unresolvedCount,
  aggregation,
  runId,
  onBack,
}: ResultsViewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [markdownCategory, setMarkdownCategory] = useState<CommentCategoryId | "all">("all");
  const [includeResolvedInMarkdown, setIncludeResolvedInMarkdown] = useState(true);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      exportToExcel({
        fileInfo,
        comments,
        aggregation,
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("엑셀 파일 생성에 실패했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleMarkdownExport = async () => {
    downloadMarkdownReport({
      fileInfo,
      comments,
      aggregation,
      categoryFilter: markdownCategory,
      includeResolved: includeResolvedInMarkdown,
    });

    if (!runId) return;

    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = supabase ? await supabase.auth.getSession() : { data: null };
      const userId = data?.session?.user.id;

      if (!supabase || !userId) return;

      const { error } = await supabase.from("markdown_exports").insert({
        user_id: userId,
        run_id: runId,
        category: markdownCategory === "all" ? null : markdownCategory,
        include_resolved: includeResolvedInMarkdown,
      });

      if (error) {
        console.error("Failed to record markdown export:", error.message);
      }
    } catch (error) {
      console.error("Failed to record markdown export:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resolutionRate =
    totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
  const categoryCounts = COMMENT_CATEGORIES.map((category) => ({
    ...category,
    count: comments.filter((comment) => comment.category === category.id).length,
  })).filter((category) => category.count > 0);

  return (
    <div className="w-full max-w-3xl">
      {/* Header with Back Button and Export Button */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          다른 파일 분석하기
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={markdownCategory}
            onChange={(event) =>
              setMarkdownCategory(event.target.value as CommentCategoryId | "all")
            }
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            aria-label="Markdown 분류 선택"
          >
            <option value="all">전체 분류</option>
            {COMMENT_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>

          <label className="flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={includeResolvedInMarkdown}
              onChange={(event) => setIncludeResolvedInMarkdown(event.target.checked)}
              className="h-4 w-4 accent-teal-600"
            />
            해결 포함
          </label>

          <button
            onClick={handleMarkdownExport}
            disabled={comments.length === 0}
            className="flex h-10 items-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white shadow-md transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h6l5 5v11a2 2 0 01-2 2z"
              />
            </svg>
            MD 다운로드
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting || comments.length === 0}
            className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {isExporting ? "내보내는 중..." : "엑셀"}
          </button>
        </div>
      </div>

      {/* File Info Header */}
      <div className="mb-8 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6 shadow-sm dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-800/50">
        <div className="flex items-start gap-4">
          {/* Figma Icon */}
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20">
            <svg
              className="h-7 w-7 text-white"
              viewBox="0 0 38 57"
              fill="currentColor"
            >
              <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
              <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
              <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
              <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
              <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
            </svg>
          </div>

          {/* File Details */}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-zinc-900 dark:text-white">
              {fileInfo.name}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              마지막 수정: {formatDate(fileInfo.lastModified)}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="전체 댓글"
            value={totalCount}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            }
            color="purple"
          />
          <StatCard
            label="해결됨"
            value={resolvedCount}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="green"
          />
          <StatCard
            label="미해결"
            value={unresolvedCount}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="orange"
          />
          <StatCard
            label="해결률"
            value={`${resolutionRate}%`}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
            color="blue"
          />
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>진행 상황</span>
            <span>{resolvedCount} / {totalCount} 해결됨</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
        </div>

        {categoryCounts.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {categoryCounts.map((category) => (
              <span
                key={category.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                title={category.description}
              >
                {category.label}
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {category.count}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Statistics Dashboard */}
      {aggregation && (
        <div className="mb-8">
          <StatsDashboard aggregation={aggregation} />
        </div>
      )}

      {/* Comments Section */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white">
          <svg
            className="h-5 w-5 text-purple-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          댓글 목록
        </h2>

        {comments.length > 0 ? (
          <CommentsList comments={comments} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <svg
                className="h-8 w-8 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
              이 파일에는 댓글이 없습니다
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              팀원들과 피드백을 주고받으면 여기에 표시됩니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: "purple" | "green" | "orange" | "blue";
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses = {
    purple: {
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-600 dark:text-purple-400",
      value: "text-purple-700 dark:text-purple-300",
    },
    green: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-600 dark:text-green-400",
      value: "text-green-700 dark:text-green-300",
    },
    orange: {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      text: "text-orange-600 dark:text-orange-400",
      value: "text-orange-700 dark:text-orange-300",
    },
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
      value: "text-blue-700 dark:text-blue-300",
    },
  };

  const classes = colorClasses[color];

  return (
    <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
      <div className="flex items-center gap-2">
        <div className={`rounded-lg p-1.5 ${classes.bg} ${classes.text}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${classes.value}`}>{value}</p>
    </div>
  );
}
