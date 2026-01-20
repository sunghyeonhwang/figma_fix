"use client";

import { useState, useEffect } from "react";
import { CommentsApiResponseWithAggregation, CommentThread, CommentAggregation } from "./lib/types/figma";
import { ResultsView, SettingsMenu } from "./components";
import { useTokenStorage } from "./lib/hooks/useTokenStorage";

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
  aggregation?: CommentAggregation;
}

export default function Home() {
  const [figmaLink, setFigmaLink] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { savedToken, isLoaded, saveToken, clearToken } = useTokenStorage();

  // Pre-fill access token from saved token when loaded
  useEffect(() => {
    if (isLoaded && savedToken && !accessToken) {
      setAccessToken(savedToken);
    }
  }, [isLoaded, savedToken, accessToken]);

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
        body: JSON.stringify({
          url: figmaLink,
          accessToken: accessToken.trim() || undefined
        }),
      });

      const data: CommentsApiResponseWithAggregation = await response.json();

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

  const handleBack = () => {
    setResult(null);
    setError(null);
  };

  // Show Results View when we have results
  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 py-8 font-sans dark:from-zinc-950 dark:to-black">
        <div className="mx-auto flex justify-center">
          <ResultsView
            fileInfo={result.fileInfo}
            comments={result.comments}
            totalCount={result.totalCount}
            resolvedCount={result.resolvedCount}
            unresolvedCount={result.unresolvedCount}
            aggregation={result.aggregation}
            onBack={handleBack}
          />
        </div>
      </div>
    );
  }

  // Show Input Screen
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 font-sans dark:from-zinc-950 dark:to-black">
      {/* Settings Button - Fixed Position */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white/80 text-zinc-500 backdrop-blur-sm transition-all hover:bg-white hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
        title="설정"
      >
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Settings Menu Modal */}
      <SettingsMenu
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        savedToken={savedToken}
        onSaveToken={(token) => {
          saveToken(token);
          setAccessToken(token);
        }}
        onClearToken={() => {
          clearToken();
          setAccessToken("");
        }}
      />

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
            {/* Figma URL Input Field */}
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

            {/* Access Token Input Field */}
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="피그마 액세스 토큰 (figd_...)"
                className="h-14 w-full rounded-xl border border-zinc-200 bg-white px-4 pr-12 text-base text-zinc-900 shadow-sm outline-none transition-all placeholder:text-zinc-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-purple-400 dark:focus:ring-purple-400/20"
              />
              {/* Toggle Token Visibility */}
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showToken ? (
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
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Token Help Text */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                <a
                  href="https://www.figma.com/developers/api#access-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400 dark:hover:text-purple-300"
                >
                  피그마 설정 → Personal access tokens
                </a>
                에서 토큰을 발급받을 수 있습니다.
              </p>
              {savedToken && (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  저장됨
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!figmaLink.trim() || !accessToken.trim() || isLoading}
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
        {!error && (
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
      </main>
    </div>
  );
}
