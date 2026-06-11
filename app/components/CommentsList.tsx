"use client";

import { useMemo, useState } from "react";
import { CommentCategoryId, CommentThread } from "../lib/types/figma";
import { CommentCard } from "./CommentCard";
import { DateRange, DateRangePicker } from "./DateRangePicker";
import { COMMENT_CATEGORIES, getCategoryDefinition } from "../lib/utils/comment-classification";

interface CommentsListProps {
  comments: CommentThread[];
}

type FilterType = "all" | "resolved" | "unresolved";
type SortType = "newest" | "oldest";
type CategoryFilterType = CommentCategoryId | "all";

interface GroupedComments {
  date: string;
  displayDate: string;
  comments: CommentThread[];
}

export function CommentsList({ comments }: CommentsListProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });

  // Filter and sort comments
  const filteredComments = useMemo(() => {
    let result = [...comments];

    // Apply filter
    if (filter === "resolved") {
      result = result.filter((c) => c.isResolved);
    } else if (filter === "unresolved") {
      result = result.filter((c) => !c.isResolved);
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter((c) => c.category === categoryFilter);
    }

    // Apply date range filter
    if (dateRange.startDate || dateRange.endDate) {
      result = result.filter((c) => {
        const commentDate = new Date(c.createdAt);
        commentDate.setHours(0, 0, 0, 0);

        if (dateRange.startDate && dateRange.endDate) {
          const start = new Date(dateRange.startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(dateRange.endDate);
          end.setHours(23, 59, 59, 999);
          return commentDate >= start && commentDate <= end;
        } else if (dateRange.startDate) {
          const start = new Date(dateRange.startDate);
          start.setHours(0, 0, 0, 0);
          return commentDate >= start;
        }
        return true;
      });
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.message.toLowerCase().includes(query) ||
          c.author.name.toLowerCase().includes(query) ||
          getCategoryDefinition(c.category).label.toLowerCase().includes(query) ||
          c.replies.some(
            (r) =>
              r.message.toLowerCase().includes(query) ||
              r.author.name.toLowerCase().includes(query)
          )
      );
    }

    // Apply sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sort === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [comments, filter, categoryFilter, sort, searchQuery, dateRange]);

  // Group comments by date
  const groupedComments = useMemo((): GroupedComments[] => {
    const groups: Record<string, CommentThread[]> = {};

    filteredComments.forEach((comment) => {
      const date = new Date(comment.createdAt);
      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(comment);
    });

    // Convert to array and format display dates
    const sortedGroups = Object.entries(groups)
      .map(([date, comments]) => ({
        date,
        displayDate: formatGroupDate(date),
        comments,
      }))
      .sort((a, b) => {
        const comparison = a.date.localeCompare(b.date);
        return sort === "newest" ? -comparison : comparison;
      });

    return sortedGroups;
  }, [filteredComments, sort]);

  // Get counts for filter badges
  const counts = useMemo(() => {
    return {
      all: comments.length,
      resolved: comments.filter((c) => c.isResolved).length,
      unresolved: comments.filter((c) => !c.isResolved).length,
    };
  }, [comments]);

  const categoryCounts = useMemo(() => {
    return COMMENT_CATEGORIES.map((category) => ({
      ...category,
      count: comments.filter((comment) => comment.category === category.id).length,
    }));
  }, [comments]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="댓글 또는 작성자 검색..."
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-purple-400"
          />
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
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
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Filter and Sort Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
            <FilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
              count={counts.all}
            >
              전체
            </FilterButton>
            <FilterButton
              active={filter === "unresolved"}
              onClick={() => setFilter("unresolved")}
              count={counts.unresolved}
              variant="warning"
            >
              미해결
            </FilterButton>
            <FilterButton
              active={filter === "resolved"}
              onClick={() => setFilter("resolved")}
              count={counts.resolved}
              variant="success"
            >
              해결됨
            </FilterButton>
          </div>

          {/* Date Range and Sort */}
          <div className="flex items-center gap-3">
            {/* Date Range Picker */}
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              maxDate={new Date()}
            />

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                정렬:
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            분류
          </span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as CategoryFilterType)}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <option value="all">전체 분류</option>
            {categoryCounts.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label} ({category.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Summary */}
      {(searchQuery || dateRange.startDate || dateRange.endDate || categoryFilter !== "all") && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {searchQuery && (
              <>
                &quot;{searchQuery}&quot;
                {(dateRange.startDate || dateRange.endDate || categoryFilter !== "all") && " · "}
              </>
            )}
            {categoryFilter !== "all" && (
              <>
                {getCategoryDefinition(categoryFilter).label}
                {(dateRange.startDate || dateRange.endDate) && " · "}
              </>
            )}
            {(dateRange.startDate || dateRange.endDate) && (
              <>
                {dateRange.startDate?.toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                -{" "}
                {dateRange.endDate?.toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                }) || "현재"}
              </>
            )}
            {" 검색 결과 "}{filteredComments.length}개
          </span>
        </div>
      )}

      {/* Grouped Comments */}
      {groupedComments.length > 0 ? (
        <div className="space-y-8">
          {groupedComments.map((group) => (
            <div key={group.date}>
              {/* Date Header */}
              <div className="sticky top-0 z-10 -mx-1 mb-4 flex items-center gap-3 bg-gradient-to-r from-zinc-50 via-zinc-50 to-transparent px-1 py-2 dark:from-zinc-950 dark:via-zinc-950">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <svg
                      className="h-4 w-4 text-purple-600 dark:text-purple-400"
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
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {group.displayDate}
                  </h3>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-zinc-200 to-transparent dark:from-zinc-700" />
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {group.comments.length}개
                </span>
              </div>

              {/* Comments for this date */}
              <div className="space-y-3">
                {group.comments.map((comment) => (
                  <CommentCard key={comment.id} comment={comment} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          filter={filter}
          searchQuery={searchQuery}
          dateRange={dateRange}
          categoryFilter={categoryFilter}
          onClearSearch={() => setSearchQuery("")}
          onClearFilter={() => setFilter("all")}
          onClearCategory={() => setCategoryFilter("all")}
          onClearDateRange={() => setDateRange({ startDate: null, endDate: null })}
        />
      )}
    </div>
  );
}

// Filter Button Component
interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  count: number;
  variant?: "default" | "success" | "warning";
  children: React.ReactNode;
}

function FilterButton({
  active,
  onClick,
  count,
  variant = "default",
  children,
}: FilterButtonProps) {
  const getCountColor = () => {
    if (!active) return "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400";

    switch (variant) {
      case "success":
        return "bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300";
      case "warning":
        return "bg-orange-200 text-orange-700 dark:bg-orange-800 dark:text-orange-300";
      default:
        return "bg-purple-200 text-purple-700 dark:bg-purple-800 dark:text-purple-300";
    }
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
        active
          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      }`}
    >
      {children}
      <span
        className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${getCountColor()}`}
      >
        {count}
      </span>
    </button>
  );
}

// Empty State Component
interface EmptyStateProps {
  filter: FilterType;
  searchQuery: string;
  dateRange: DateRange;
  categoryFilter: CategoryFilterType;
  onClearSearch: () => void;
  onClearFilter: () => void;
  onClearCategory: () => void;
  onClearDateRange: () => void;
}

function EmptyState({
  filter,
  searchQuery,
  dateRange,
  categoryFilter,
  onClearSearch,
  onClearFilter,
  onClearCategory,
  onClearDateRange,
}: EmptyStateProps) {
  const hasDateFilter = dateRange.startDate || dateRange.endDate;

  const getMessage = () => {
    if (searchQuery) {
      return `"${searchQuery}"에 대한 검색 결과가 없습니다.`;
    }
    if (hasDateFilter) {
      return "선택한 기간에 댓글이 없습니다.";
    }
    if (categoryFilter !== "all") {
      return `${getCategoryDefinition(categoryFilter).label} 분류의 댓글이 없습니다.`;
    }
    switch (filter) {
      case "resolved":
        return "해결된 댓글이 없습니다.";
      case "unresolved":
        return "미해결 댓글이 없습니다.";
      default:
        return "댓글이 없습니다.";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-12 dark:border-zinc-700 dark:bg-zinc-800/30">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <svg
          className="h-6 w-6 text-zinc-400"
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
      <p className="mb-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {getMessage()}
      </p>
      {(searchQuery || filter !== "all" || categoryFilter !== "all" || hasDateFilter) && (
        <div className="flex flex-wrap justify-center gap-2">
          {searchQuery && (
            <button
              onClick={onClearSearch}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              검색어 지우기
            </button>
          )}
          {hasDateFilter && (
            <button
              onClick={onClearDateRange}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              기간 초기화
            </button>
          )}
          {filter !== "all" && (
            <button
              onClick={onClearFilter}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              필터 초기화
            </button>
          )}
          {categoryFilter !== "all" && (
            <button
              onClick={onClearCategory}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              분류 초기화
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to format group date
function formatGroupDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return "오늘";
  }
  if (isYesterday) {
    return "어제";
  }

  // Check if within this week
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (date > weekAgo) {
    const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    return dayNames[date.getDay()];
  }

  // Check if this year
  if (date.getFullYear() === today.getFullYear()) {
    return date.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });
  }

  // Full date for older
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
