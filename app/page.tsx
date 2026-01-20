"use client";

import { useState } from "react";
import { CommentsApiResponse, CommentThread } from "./lib/types/figma";

interface AnalysisResult {
  fileInfo: {
    name: string;
    key: string;
    lastModified: string;
  };
  comments: CommentThread[];
  totalCount: number;
  resolvedCount: number;
  unresolvedCount: number;
}

export default function Home() {
  const [figmaLink, setFigmaLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!figmaLink.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/figma/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: figmaLink }),
      });

      const data: CommentsApiResponse = await response.json();

      if (data.success && data.data) {
        setResult(data.data);
      } else {
        setError(data.error?.message || "알 수 없는 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const isValidFigmaLink = (link: string) => {
    const regex = /^https?:\/\/(www\.)?figma\.com\/(file|design|proto|board)\/[a-zA-Z0-9]+/;
    return regex.test(link);
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 font-sans dark:from-zinc-950 dark:to-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8">
        {/* Logo / Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
          <svg
            className="h-8 w-8 text-white"
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
        </div>

        {/* Title and Description */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Figma Comment Reader
          </h1>
          <p className="max-w-md text-base text-zinc-600 dark:text-zinc-400">
            피그마 파일 링크를 입력하면 댓글을 분석하고 정리해 드립니다.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex flex-col gap-4">
            {/* Input Field */}
            <div className="relative">
              <input
                type="url"
                value={figmaLink}
                onChange={(e) => setFigmaLink(e.target.value)}
                placeholder="https://www.figma.com/file/..."
                className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 pr-12 text-base text-zinc-900 shadow-sm outline-none transition-all placeholder:text-zinc-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-purple-400 dark:focus:ring-purple-400/20"
              />
              {/* Figma Icon */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <svg
                  className="h-5 w-5 text-zinc-400"
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!figmaLink.trim() || isLoading}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-base font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-700 hover:to-pink-700 hover:shadow-xl hover:shadow-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none dark:focus:ring-offset-zinc-900"
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  분석 중...
                </>
              ) : (
                <>
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  분석하기
                </>
              )}
            </button>
          </div>
        </form>

        {/* Helper Text */}
        {!result && !error && (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-500">
            피그마 파일, 프로토타입, 또는 디자인 시스템 링크를 지원합니다
          </p>
        )}

        {/* Error Message */}
        {error && (
          <div className="w-full rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-center text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="w-full space-y-6">
            {/* File Info */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {result.fileInfo.name}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                마지막 수정: {formatDate(result.fileInfo.lastModified)}
              </p>

              {/* Stats */}
              <div className="mt-4 flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                    {result.totalCount}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    전체 댓글
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    {result.resolvedCount}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    해결됨
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                    {result.unresolvedCount}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    미해결
                  </span>
                </div>
              </div>
            </div>

            {/* Comments List */}
            {result.comments.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                  댓글 목록
                </h3>
                {result.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`rounded-xl border p-4 ${
                      comment.isResolved
                        ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                        : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                    }`}
                  >
                    {/* Comment Header */}
                    <div className="flex items-center gap-3">
                      <img
                        src={comment.author.avatarUrl}
                        alt={comment.author.name}
                        className="h-8 w-8 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                          {comment.author.name}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                      {comment.isResolved && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-400">
                          해결됨
                        </span>
                      )}
                    </div>

                    {/* Comment Message */}
                    <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      {comment.message}
                    </p>

                    {/* Replies */}
                    {comment.replies.length > 0 && (
                      <div className="mt-4 space-y-3 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
                        {comment.replies.map((reply) => (
                          <div key={reply.id}>
                            <div className="flex items-center gap-2">
                              <img
                                src={reply.author.avatarUrl}
                                alt={reply.author.name}
                                className="h-6 w-6 rounded-full"
                              />
                              <p className="text-xs font-medium text-zinc-900 dark:text-white">
                                {reply.author.name}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {formatDate(reply.createdAt)}
                              </p>
                            </div>
                            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                              {reply.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-zinc-500 dark:text-zinc-400">
                  이 파일에는 댓글이 없습니다.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
