"use client";

import { useState, useRef, useEffect } from "react";

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  dot?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: (SelectOption | string)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export default function CustomSelect({
  value = "",
  onChange,
  options,
  placeholder = "Chọn...",
  disabled = false,
  className = "",
  id,
  name,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to SelectOption[]
  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

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

  // Close on Escape key
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

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden native input for form compatibility if name provided */}
      {name && <input type="hidden" name={name} value={value} id={id} />}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-sm transition-all text-left cursor-pointer border shadow-2xs ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800"
            : isOpen
            ? "border-zinc-900 dark:border-zinc-500 ring-2 ring-zinc-900/10 dark:ring-zinc-400/20 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            : "bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-700/60 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
        }`}
      >
        <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="shrink-0 flex items-center justify-center">{selectedOption.icon}</span>
          )}
          {selectedOption?.dot && !selectedOption.icon && (
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${selectedOption.dot}`}
            />
          )}
          <span
            className={`truncate ${
              selectedOption
                ? "text-zinc-900 dark:text-zinc-100 font-medium"
                : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 ml-auto shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        {/* Chevron icon that rotates on open */}
        <svg
          className={`w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-zinc-700 dark:text-zinc-300" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Floating Menu */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1.5 left-0 right-0 min-w-[200px] p-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl backdrop-blur-md max-h-64 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-150">
          <div role="listbox" className="space-y-0.5">
            {normalizedOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-zinc-400 dark:text-zinc-500 text-center">
                Không có lựa chọn nào
              </div>
            ) : (
              normalizedOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-left cursor-pointer ${
                      isSelected
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                      {opt.icon && (
                        <span className="shrink-0 flex items-center justify-center">{opt.icon}</span>
                      )}
                      {opt.dot && !opt.icon && (
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`}
                        />
                      )}
                      <div className="truncate">
                        <span className="block truncate">{opt.label}</span>
                        {opt.subLabel && (
                          <span className="block text-xs font-normal text-zinc-400 dark:text-zinc-500 truncate">
                            {opt.subLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-600 dark:text-zinc-400">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0"
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
