"use client";

import { useMemo, useState } from "react";
import {
  CommentAggregation,
  AuthorStats,
  DailyStats,
  HourlyStats,
} from "../lib/types/figma";
import { formatDuration } from "../lib/utils/comment-aggregation";

interface StatsDashboardProps {
  aggregation: CommentAggregation;
}

export function StatsDashboard({ aggregation }: StatsDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const { overview, byAuthor, byDate, byHour, timeRange } = aggregation;

  // Get top 5 most active authors
  const topAuthors = useMemo(() => byAuthor.slice(0, 5), [byAuthor]);

  // Get max value for chart scaling
  const maxDailyCount = useMemo(
    () => Math.max(...byDate.map((d) => d.count), 1),
    [byDate]
  );

  // Get max hourly count for heatmap
  const maxHourlyCount = useMemo(
    () => Math.max(...byHour.map((h) => h.count), 1),
    [byHour]
  );

  // Format date for display
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };

  // Format time range dates
  const formatTimeRangeDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header with Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
            <svg
              className="h-5 w-5 text-white"
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
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              통계 대시보드
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              댓글 분석 및 활동 통계
            </p>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-zinc-400 transition-transform duration-200 ${
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

      {/* Expandable Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-6 border-t border-zinc-200 p-6 dark:border-zinc-700">
          {/* Time Range Info */}
          {timeRange.spanDays > 0 && (
            <div className="rounded-xl bg-gradient-to-r from-zinc-50 to-zinc-100 p-4 dark:from-zinc-800/50 dark:to-zinc-800/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>
                    {formatTimeRangeDate(timeRange.earliest)} ~{" "}
                    {formatTimeRangeDate(timeRange.latest)}
                  </span>
                </div>
                <div className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  {timeRange.spanDays}일간의 활동
                </div>
              </div>
            </div>
          )}

          {/* Resolution Stats Summary */}
          {overview.averageResolutionTimeMs && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MiniStatCard
                label="평균 해결 시간"
                value={formatDuration(overview.averageResolutionTimeMs)}
                icon={
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
                }
                color="cyan"
              />
              <MiniStatCard
                label="활동 기간"
                value={`${timeRange.spanDays}일`}
                icon={
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                }
                color="violet"
              />
            </div>
          )}

          {/* Daily Trend Chart */}
          {byDate.length > 1 && (
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <svg
                  className="h-4 w-4 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
                일별 댓글 추이
              </h3>
              <DailyTrendChart
                data={byDate}
                maxCount={maxDailyCount}
                formatDate={formatDateLabel}
              />
            </div>
          )}

          {/* Hourly Activity Heatmap */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              <svg
                className="h-4 w-4 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              시간대별 활동
            </h3>
            <HourlyHeatmap data={byHour} maxCount={maxHourlyCount} />
          </div>

          {/* Top Authors */}
          {topAuthors.length > 0 && (
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <svg
                  className="h-4 w-4 text-pink-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                활발한 참여자 TOP {topAuthors.length}
              </h3>
              <TopAuthorsSection authors={topAuthors} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mini Stat Card Component
interface MiniStatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "cyan" | "violet" | "emerald" | "amber";
}

function MiniStatCard({ label, value, icon, color }: MiniStatCardProps) {
  const colorClasses = {
    cyan: {
      bg: "bg-cyan-100 dark:bg-cyan-900/30",
      text: "text-cyan-600 dark:text-cyan-400",
    },
    violet: {
      bg: "bg-violet-100 dark:bg-violet-900/30",
      text: "text-violet-600 dark:text-violet-400",
    },
    emerald: {
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    amber: {
      bg: "bg-amber-100 dark:bg-amber-900/30",
      text: "text-amber-600 dark:text-amber-400",
    },
  };

  const classes = colorClasses[color];

  return (
    <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
      <div className={`rounded-lg p-2 ${classes.bg} ${classes.text}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-base font-semibold text-zinc-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

// Daily Trend Chart Component
interface DailyTrendChartProps {
  data: DailyStats[];
  maxCount: number;
  formatDate: (date: string) => string;
}

function DailyTrendChart({ data, maxCount, formatDate }: DailyTrendChartProps) {
  // Show last 14 days max for readability
  const displayData = data.slice(-14);

  return (
    <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
      {/* Chart Container */}
      <div className="flex h-40 items-end gap-1.5">
        {displayData.map((day) => {
          const height = (day.count / maxCount) * 100;
          const resolvedHeight = (day.resolvedCount / maxCount) * 100;
          const isToday =
            day.date ===
            new Date().toISOString().split("T")[0];

          return (
            <div
              key={day.date}
              className="group relative flex flex-1 flex-col items-center"
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-16 left-1/2 z-10 min-w-max -translate-x-1/2 transform rounded-lg bg-zinc-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-zinc-700">
                <p className="font-medium">{formatDate(day.date)}</p>
                <p className="text-zinc-300">
                  {day.count}개 댓글 ({day.resolvedCount} 해결)
                </p>
                <p className="text-zinc-400">{day.authors.length}명 참여</p>
              </div>

              {/* Bar */}
              <div
                className={`relative w-full min-w-[8px] overflow-hidden rounded-t-sm transition-all duration-200 ${
                  isToday
                    ? "bg-gradient-to-t from-purple-500 to-pink-400"
                    : "bg-gradient-to-t from-blue-500 to-cyan-400"
                }`}
                style={{ height: `${Math.max(height, 4)}%` }}
              >
                {/* Resolved portion overlay */}
                <div
                  className="absolute bottom-0 w-full bg-green-400/40"
                  style={{ height: `${(resolvedHeight / height) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="mt-2 flex gap-1.5">
        {displayData.map((day, index) => {
          // Show label for first, last, and every 3rd item
          const showLabel =
            index === 0 ||
            index === displayData.length - 1 ||
            index % 3 === 0;

          return (
            <div key={day.date} className="flex-1 text-center">
              {showLabel && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {formatDate(day.date)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-blue-500 to-cyan-400" />
          <span>전체 댓글</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-green-400" />
          <span>해결됨</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-purple-500 to-pink-400" />
          <span>오늘</span>
        </div>
      </div>
    </div>
  );
}

// Hourly Heatmap Component
interface HourlyHeatmapProps {
  data: HourlyStats[];
  maxCount: number;
}

function HourlyHeatmap({ data, maxCount }: HourlyHeatmapProps) {
  const getIntensityClass = (count: number) => {
    if (count === 0) return "bg-zinc-100 dark:bg-zinc-800";
    const intensity = count / maxCount;
    if (intensity > 0.75)
      return "bg-amber-500 dark:bg-amber-500";
    if (intensity > 0.5)
      return "bg-amber-400 dark:bg-amber-400";
    if (intensity > 0.25)
      return "bg-amber-300 dark:bg-amber-500/60";
    return "bg-amber-200 dark:bg-amber-500/30";
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return "12AM";
    if (hour === 12) return "12PM";
    if (hour < 12) return `${hour}AM`;
    return `${hour - 12}PM`;
  };

  // Group into morning (0-5), daytime (6-11), afternoon (12-17), evening (18-23)
  const timeGroups = [
    { label: "새벽", range: [0, 6] },
    { label: "오전", range: [6, 12] },
    { label: "오후", range: [12, 18] },
    { label: "저녁", range: [18, 24] },
  ];

  return (
    <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
      {/* Heatmap Grid */}
      <div className="grid grid-cols-24 gap-1">
        {data.map((hourData) => (
          <div key={hourData.hour} className="group relative">
            {/* Cell */}
            <div
              className={`aspect-square w-full rounded-sm transition-all hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-500 ${getIntensityClass(
                hourData.count
              )}`}
            />
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-14 left-1/2 z-10 min-w-max -translate-x-1/2 transform rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-zinc-700">
              <p className="font-medium">{formatHour(hourData.hour)}</p>
              <p className="text-zinc-300">{hourData.count}개 댓글</p>
            </div>
          </div>
        ))}
      </div>

      {/* Time labels */}
      <div className="mt-2 flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
        {timeGroups.map((group) => (
          <span key={group.label}>{group.label}</span>
        ))}
      </div>

      {/* Intensity Legend */}
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span>적음</span>
        <div className="flex gap-0.5">
          <div className="h-3 w-3 rounded-sm bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-3 w-3 rounded-sm bg-amber-200 dark:bg-amber-500/30" />
          <div className="h-3 w-3 rounded-sm bg-amber-300 dark:bg-amber-500/60" />
          <div className="h-3 w-3 rounded-sm bg-amber-400 dark:bg-amber-400" />
          <div className="h-3 w-3 rounded-sm bg-amber-500 dark:bg-amber-500" />
        </div>
        <span>많음</span>
      </div>
    </div>
  );
}

// Top Authors Section Component
interface TopAuthorsSectionProps {
  authors: AuthorStats[];
}

function TopAuthorsSection({ authors }: TopAuthorsSectionProps) {
  const maxComments = authors[0]?.totalComments || 1;

  return (
    <div className="space-y-2.5">
      {authors.map((author, index) => {
        const barWidth = (author.totalComments / maxComments) * 100;
        const resolvedPercent =
          author.rootComments > 0
            ? Math.round(
                (author.resolvedComments / author.rootComments) * 100
              )
            : 0;

        return (
          <div
            key={author.authorId}
            className="rounded-xl bg-zinc-50 p-3 transition-all hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
          >
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  index === 0
                    ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white"
                    : index === 1
                    ? "bg-gradient-to-br from-zinc-300 to-zinc-400 text-white"
                    : index === 2
                    ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
                    : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                }`}
              >
                {index + 1}
              </div>

              {/* Avatar */}
              {author.avatarUrl ? (
                <img
                  src={author.avatarUrl}
                  alt={author.authorName}
                  className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-zinc-800"
                />
              ) : (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-xs font-bold text-white ring-2 ring-white dark:ring-zinc-800">
                  {author.authorName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Author Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                    {author.authorName}
                  </p>
                  <div className="ml-2 flex items-center gap-2 text-xs">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {author.totalComments}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500">댓글</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* Stats Pills */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                    스레드 {author.rootComments}
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    답글 {author.replies}
                  </span>
                  {author.rootComments > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        resolvedPercent >= 80
                          ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                          : resolvedPercent >= 50
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
                      }`}
                    >
                      해결률 {resolvedPercent}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
