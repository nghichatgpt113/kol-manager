"use client";

import { useState, useRef, useEffect, useMemo } from "react";

interface DatePickerProps {
  value?: string; // ISO format "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  size?: "xs" | "sm" | "md";
}

const VI_WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const VI_MONTHS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

// Helper to format YYYY-MM-DD into DD/MM/YYYY
function formatDisplayDate(isoString: string): string {
  if (!isoString) return "";
  const parts = isoString.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }
  return isoString;
}

export default function DatePicker({
  value = "",
  onChange,
  placeholder = "dd/mm/yyyy",
  disabled = false,
  className = "",
  id,
  name,
  size = "md",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial view year and month
  const initialDate = useMemo(() => {
    if (value) {
      const [y, m, d] = value.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m - 1, d);
      }
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      if (value) {
        const [y, m] = value.split("-").map(Number);
        if (!isNaN(y) && !isNaN(m)) {
          setViewYear(y);
          setViewMonth(m - 1);
        }
      }
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Select day
  const handleSelectDay = (day: number, monthOffset = 0) => {
    let targetYear = viewYear;
    let targetMonth = viewMonth + monthOffset;

    if (targetMonth < 0) {
      targetMonth = 11;
      targetYear -= 1;
    } else if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    const isoString = `${targetYear}-${pad(targetMonth + 1)}-${pad(day)}`;
    onChange(isoString);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const isoString = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(
      today.getDate()
    )}`;
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange(isoString);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    // First day of current month
    const firstDay = new Date(viewYear, viewMonth, 1);
    // getDay: 0 = Sun, 1 = Mon ... 6 = Sat
    // Convert to Monday = 0, Sunday = 6
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: {
      day: number;
      monthOffset: number;
      isCurrentMonth: boolean;
      isoString: string;
    }[] = [];

    const pad = (n: number) => String(n).padStart(2, "0");

    // Days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      let prevM = viewMonth - 1;
      let prevY = viewYear;
      if (prevM < 0) {
        prevM = 11;
        prevY -= 1;
      }
      days.push({
        day: d,
        monthOffset: -1,
        isCurrentMonth: false,
        isoString: `${prevY}-${pad(prevM + 1)}-${pad(d)}`,
      });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        monthOffset: 0,
        isCurrentMonth: true,
        isoString: `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`,
      });
    }

    // Days from next month to fill grid (always multiple of 7)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        let nextM = viewMonth + 1;
        let nextY = viewYear;
        if (nextM > 11) {
          nextM = 0;
          nextY += 1;
        }
        days.push({
          day: d,
          monthOffset: 1,
          isCurrentMonth: false,
          isoString: `${nextY}-${pad(nextM + 1)}-${pad(d)}`,
        });
      }
    }

    return days;
  }, [viewYear, viewMonth]);

  const todayIso = useMemo(() => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(
      today.getDate()
    )}`;
  }, []);

  const sizeClasses = {
    xs: "px-2 py-1 text-xs rounded-lg gap-1.5",
    sm: "px-2.5 py-1.5 text-xs rounded-xl gap-2",
    md: "px-3.5 py-2 text-sm rounded-xl gap-2",
  }[size];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden input for form submitting */}
      {name && <input type="hidden" name={name} value={value} id={id} />}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between transition-all text-left cursor-pointer border shadow-2xs ${sizeClasses} ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800"
            : isOpen
            ? "border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/15 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            : "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
        }`}
      >
        <span
          className={
            value
              ? "text-zinc-900 dark:text-zinc-100 font-medium font-mono text-sm"
              : "text-zinc-400 dark:text-zinc-500"
          }
        >
          {value ? formatDisplayDate(value) : placeholder}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <span
              onClick={handleClear}
              role="button"
              tabIndex={0}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors"
              title="Xóa ngày"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </span>
          )}

          {/* Calendar SVG Icon */}
          <svg
            className={`w-4 h-4 transition-colors ${
              isOpen
                ? "text-zinc-900 dark:text-zinc-100"
                : "text-zinc-400 dark:text-zinc-500"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </button>

      {/* Floating Popover Calendar */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1.5 left-0 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl backdrop-blur-md w-72 animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Calendar Header: Month/Year title & Navigation */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {VI_MONTHS[viewMonth]}, {viewYear}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Tháng trước"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Tháng sau"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {VI_WEEKDAYS.map((wd) => (
              <span
                key={wd}
                className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 py-1"
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((item, idx) => {
              const isSelected = value === item.isoString;
              const isToday = todayIso === item.isoString;

              return (
                <button
                  key={`${item.isoString}-${idx}`}
                  type="button"
                  onClick={() => handleSelectDay(item.day, item.monthOffset)}
                  className={`h-8 w-8 mx-auto rounded-xl flex items-center justify-center text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-xs"
                      : isToday
                      ? "border border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                      : item.isCurrentMonth
                      ? "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      : "text-zinc-300 dark:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  }`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Hôm nay
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
