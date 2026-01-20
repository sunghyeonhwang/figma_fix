"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function DateRangePicker({
  value,
  onChange,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [tempRange, setTempRange] = useState<DateRange>(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync temp range with value when picker opens
  useEffect(() => {
    if (isOpen) {
      setTempRange(value);
      setSelecting(value.startDate && !value.endDate ? "end" : "start");
      // Set current month to start date or today
      if (value.startDate) {
        setCurrentMonth(new Date(value.startDate));
      } else {
        setCurrentMonth(new Date());
      }
    }
  }, [isOpen, value]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateClick = useCallback(
    (date: Date) => {
      if (selecting === "start") {
        setTempRange({ startDate: date, endDate: null });
        setSelecting("end");
      } else {
        // Ensure end date is after start date
        if (tempRange.startDate && date < tempRange.startDate) {
          setTempRange({ startDate: date, endDate: tempRange.startDate });
        } else {
          setTempRange({ ...tempRange, endDate: date });
        }
      }
    },
    [selecting, tempRange]
  );

  const handleApply = useCallback(() => {
    onChange(tempRange);
    setIsOpen(false);
  }, [onChange, tempRange]);

  const handleClear = useCallback(() => {
    const clearedRange = { startDate: null, endDate: null };
    setTempRange(clearedRange);
    onChange(clearedRange);
    setIsOpen(false);
  }, [onChange]);

  const handleQuickSelect = useCallback(
    (days: number) => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(start.getDate() - days);
      start.setHours(0, 0, 0, 0);
      const newRange = { startDate: start, endDate: end };
      setTempRange(newRange);
      onChange(newRange);
      setIsOpen(false);
    },
    [onChange]
  );

  const formatDisplayDate = (range: DateRange) => {
    if (!range.startDate && !range.endDate) {
      return "전체 기간";
    }
    const formatDate = (d: Date) =>
      d.toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      });
    if (range.startDate && range.endDate) {
      return `${formatDate(range.startDate)} - ${formatDate(range.endDate)}`;
    }
    if (range.startDate) {
      return `${formatDate(range.startDate)} ~`;
    }
    return "전체 기간";
  };

  const isDateInRange = (date: Date) => {
    if (!tempRange.startDate || !tempRange.endDate) return false;
    return date >= tempRange.startDate && date <= tempRange.endDate;
  };

  const isDateSelected = (date: Date) => {
    const dateStr = date.toDateString();
    return (
      (tempRange.startDate && tempRange.startDate.toDateString() === dateStr) ||
      (tempRange.endDate && tempRange.endDate.toDateString() === dateStr)
    );
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const hasFilter = value.startDate || value.endDate;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-all ${
          hasFilter
            ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600"
        }`}
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>{formatDisplayDate(value)}</span>
        {hasFilter && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="ml-1 rounded-full p-0.5 hover:bg-purple-200 dark:hover:bg-purple-800"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[320px] rounded-xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
          {/* Quick Select Buttons */}
          <div className="mb-4 flex flex-wrap gap-2">
            <QuickSelectButton onClick={() => handleQuickSelect(7)}>
              최근 7일
            </QuickSelectButton>
            <QuickSelectButton onClick={() => handleQuickSelect(30)}>
              최근 30일
            </QuickSelectButton>
            <QuickSelectButton onClick={() => handleQuickSelect(90)}>
              최근 90일
            </QuickSelectButton>
          </div>

          {/* Selection Indicator */}
          <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span
              className={`rounded px-2 py-1 ${
                selecting === "start"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                  : "bg-zinc-100 dark:bg-zinc-700"
              }`}
            >
              시작일:{" "}
              {tempRange.startDate
                ? tempRange.startDate.toLocaleDateString("ko-KR", {
                    month: "short",
                    day: "numeric",
                  })
                : "선택"}
            </span>
            <span className="text-zinc-300 dark:text-zinc-600">→</span>
            <span
              className={`rounded px-2 py-1 ${
                selecting === "end"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                  : "bg-zinc-100 dark:bg-zinc-700"
              }`}
            >
              종료일:{" "}
              {tempRange.endDate
                ? tempRange.endDate.toLocaleDateString("ko-KR", {
                    month: "short",
                    day: "numeric",
                  })
                : "선택"}
            </span>
          </div>

          {/* Calendar Header */}
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => {
                const prev = new Date(currentMonth);
                prev.setMonth(prev.getMonth() - 1);
                setCurrentMonth(prev);
              }}
              className="rounded-lg p-1.5 text-zinc-500 transition-all hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
              {currentMonth.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
              })}
            </span>
            <button
              onClick={() => {
                const next = new Date(currentMonth);
                next.setMonth(next.getMonth() + 1);
                setCurrentMonth(next);
              }}
              className="rounded-lg p-1.5 text-zinc-500 transition-all hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <Calendar
            currentMonth={currentMonth}
            onDateClick={handleDateClick}
            isDateInRange={isDateInRange}
            isDateSelected={isDateSelected}
            isDateDisabled={isDateDisabled}
            tempRange={tempRange}
          />

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-700">
            <button
              onClick={handleClear}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              초기화
            </button>
            <button
              onClick={handleApply}
              disabled={!tempRange.startDate}
              className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1.5 text-sm font-medium text-white transition-all hover:from-purple-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Quick Select Button
function QuickSelectButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-all hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:border-purple-500 dark:hover:bg-purple-900/30 dark:hover:text-purple-300"
    >
      {children}
    </button>
  );
}

// Calendar Component
interface CalendarProps {
  currentMonth: Date;
  onDateClick: (date: Date) => void;
  isDateInRange: (date: Date) => boolean;
  isDateSelected: (date: Date) => boolean;
  isDateDisabled: (date: Date) => boolean;
  tempRange: DateRange;
}

function Calendar({
  currentMonth,
  onDateClick,
  isDateInRange,
  isDateSelected,
  isDateDisabled,
  tempRange,
}: CalendarProps) {
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      {/* Day Headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayNames.map((day, i) => (
          <div
            key={day}
            className={`py-1 text-center text-xs font-medium ${
              i === 0
                ? "text-red-400 dark:text-red-500"
                : i === 6
                  ? "text-blue-400 dark:text-blue-500"
                  : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day Cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-8" />;
          }

          const isSelected = isDateSelected(date);
          const inRange = isDateInRange(date);
          const disabled = isDateDisabled(date);
          const isToday = date.toDateString() === today.toDateString();
          const isStartDate =
            tempRange.startDate &&
            date.toDateString() === tempRange.startDate.toDateString();
          const isEndDate =
            tempRange.endDate &&
            date.toDateString() === tempRange.endDate.toDateString();
          const dayOfWeek = date.getDay();

          return (
            <button
              key={date.toISOString()}
              onClick={() => !disabled && onDateClick(date)}
              disabled={disabled}
              className={`relative flex h-8 w-full items-center justify-center text-sm transition-all ${
                disabled
                  ? "cursor-not-allowed text-zinc-300 dark:text-zinc-600"
                  : isSelected
                    ? "font-semibold text-white"
                    : inRange
                      ? "bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-100"
                      : isToday
                        ? "font-semibold text-purple-600 dark:text-purple-400"
                        : dayOfWeek === 0
                          ? "text-red-500 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-700"
                          : dayOfWeek === 6
                            ? "text-blue-500 hover:bg-zinc-100 dark:text-blue-400 dark:hover:bg-zinc-700"
                            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
              } ${isStartDate ? "rounded-l-lg" : ""} ${isEndDate ? "rounded-r-lg" : ""}`}
            >
              {isSelected && (
                <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500" />
              )}
              <span className="relative">{date.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
