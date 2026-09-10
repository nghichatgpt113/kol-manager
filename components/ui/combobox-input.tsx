"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { POPULAR_NICHES, getNicheStyle } from "@/lib/constants/niches";

export interface ComboboxOption {
  value: string;
  label: string;
  icon?: string;
  dotClass?: string;
  badgeClass?: string;
  description?: string;
}

interface ComboboxInputProps {
  value: string;
  onChange: (value: string) => void;
  options?: ComboboxOption[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_OPTIONS: ComboboxOption[] = POPULAR_NICHES.map((n) => ({
  value: n.label,
  label: n.label,
  icon: n.icon,
  dotClass: n.dotClass,
  badgeClass: n.badgeClass,
  description: n.description,
}));

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function ComboboxInput({
  value = "",
  onChange,
  options = DEFAULT_OPTIONS,
  placeholder = "Chọn ngành hàng hoặc tự gõ...",
  id,
  disabled = false,
  className = "",
}: ComboboxInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter options based on typed input
  const filteredOptions = useMemo(() => {
    if (!value.trim()) return options;
    const queryNorm = normalizeText(value);
    return options.filter((opt) => {
      const labelNorm = normalizeText(opt.label);
      const descNorm = opt.description ? normalizeText(opt.description) : "";
      return labelNorm.includes(queryNorm) || descNorm.includes(queryNorm);
    });
  }, [options, value]);

  // Check if current value matches an existing option exactly
  const hasExactMatch = useMemo(() => {
    const valNorm = normalizeText(value);
    if (!valNorm) return false;
    return options.some((opt) => normalizeText(opt.label) === valNorm);
  }, [options, value]);

  // Close on outside click
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

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex, isOpen]);

  const handleSelectOption = useCallback(
    (optValue: string) => {
      onChange(optValue);
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(0);
      } else {
        const totalItems = filteredOptions.length + (!hasExactMatch && value.trim() ? 1 : 0);
        setActiveIndex((prev) => (prev + 1) % Math.max(1, totalItems));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const totalItems = filteredOptions.length + (!hasExactMatch && value.trim() ? 1 : 0);
        setActiveIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems));
      }
    } else if (e.key === "Enter") {
      if (isOpen) {
        e.preventDefault(); // Don't submit parent form
        const showCustomItem = !hasExactMatch && value.trim().length > 0;
        if (showCustomItem && activeIndex === 0) {
          handleSelectOption(value.trim());
        } else {
          const targetIndex = showCustomItem ? activeIndex - 1 : activeIndex;
          if (targetIndex >= 0 && targetIndex < filteredOptions.length) {
            handleSelectOption(filteredOptions[targetIndex].value);
          } else {
            // If enter with no active index, close menu preserving typed value
            setIsOpen(false);
          }
        }
      }
    } else if (e.key === "Escape") {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    inputRef.current?.focus();
  };

  const showCustomOption = !hasExactMatch && value.trim().length > 0;
  const currentStyle = value ? getNicheStyle(value) : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input container */}
      <div className="relative flex items-center">
        {/* Leading Dot or Icon if value exists */}
        {value && currentStyle && (
          <div className="absolute left-3 flex items-center pointer-events-none">
            {currentStyle.icon ? (
              <span className="text-xs leading-none mr-1">{currentStyle.icon}</span>
            ) : (
              <span
                className={`w-2 h-2 rounded-full ${currentStyle.dotClass}`}
              />
            )}
          </div>
        )}

        <input
          ref={inputRef}
          id={id}
          type="text"
          disabled={disabled}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border text-sm transition-all shadow-2xs ${
            value && currentStyle ? "pl-8 pr-16" : "pl-3.5 pr-16"
          } ${
            disabled
              ? "opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800"
              : isOpen
              ? "border-zinc-900 dark:border-zinc-500 ring-2 ring-zinc-900/10 dark:ring-zinc-400/20 text-zinc-900 dark:text-zinc-100"
              : "border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 focus:outline-hidden"
          }`}
        />

        {/* Trailing action icons */}
        <div className="absolute right-2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition cursor-pointer"
              title="Xóa"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }
            }}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
            aria-label="Mở danh sách"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "rotate-180 text-zinc-700 dark:text-zinc-300" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dropdown Floating Menu */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1.5 left-0 right-0 p-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl backdrop-blur-md max-h-64 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header label in dropdown */}
          <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 mb-1 flex items-center justify-between">
            <span>Ngành hàng nổi bật</span>
            <span className="text-[10px] normal-case font-normal text-zinc-400">
              Có thể chọn hoặc tự gõ
            </span>
          </div>

          <div ref={listRef} role="listbox" className="space-y-0.5">
            {/* Custom Input Option if typed value doesn't match predefined */}
            {showCustomOption && (
              <button
                type="button"
                role="option"
                aria-selected={activeIndex === 0}
                onClick={() => handleSelectOption(value.trim())}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-left cursor-pointer border border-dashed ${
                  activeIndex === 0
                    ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-semibold"
                    : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-xs">➕</span>
                  <span className="truncate">
                    Sử dụng ngành tùy chọn:{" "}
                    <strong className="text-zinc-900 dark:text-zinc-100">
                      &ldquo;{value.trim()}&rdquo;
                    </strong>
                  </span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 shrink-0">
                  Tự nhập
                </span>
              </button>
            )}

            {/* List of matched options */}
            {filteredOptions.length === 0 && !showCustomOption ? (
              <div className="px-3 py-4 text-xs text-zinc-400 dark:text-zinc-500 text-center">
                Không tìm thấy ngành phù hợp. Bạn có thể bấm Enter để sử dụng &ldquo;{value}&rdquo;.
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const itemIndex = showCustomOption ? idx + 1 : idx;
                const isSelected =
                  value.toLowerCase().trim() === opt.value.toLowerCase();
                const isActive = activeIndex === itemIndex;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-left cursor-pointer ${
                      isActive
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                        : isSelected
                        ? "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 font-semibold"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                      {opt.icon ? (
                        <span className="text-sm leading-none shrink-0">{opt.icon}</span>
                      ) : opt.dotClass ? (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotClass}`} />
                      ) : null}

                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium truncate">{opt.label}</span>
                          {opt.dotClass && !opt.icon && (
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${opt.dotClass}`} />
                          )}
                        </div>
                        {opt.description && (
                          <span className="block text-xs font-normal text-zinc-400 dark:text-zinc-500 truncate">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
