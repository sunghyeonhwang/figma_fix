"use client";

import { useState } from "react";

export default function Home() {
  const [figmaLink, setFigmaLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!figmaLink.trim()) return;

    setIsLoading(true);
    // TODO: Implement actual analysis logic
    console.log("Analyzing Figma link:", figmaLink);

    // Simulating loading state for now
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const isValidFigmaLink = (link: string) => {
    return link.includes("figma.com");
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
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-500">
          피그마 파일, 프로토타입, 또는 디자인 시스템 링크를 지원합니다
        </p>
      </main>
    </div>
  );
}
