"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { Kol } from "@/lib/types/kol";
import PlatformIcon from "@/components/icons/platform-icon";

interface SearchableKolSelectProps {
  kols: Kol[];
  value: string;
  onChange: (kolId: string) => void;
  placeholder?: string;
  className?: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function SearchableKolSelect({
  kols,
  value,
  onChange,
  placeholder = "Tìm & chọn KOL...",
  className = "",
}: SearchableKolSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedKol = useMemo(() => kols.find((k) => k.id === value), [kols, value]);

  // Filter KOLs based on search query
  const filteredKols = useMemo(() => {
    if (!search.trim()) return kols;
    const query = normalizeText(search);
    return kols.filter((k) => {
      const uNorm = normalizeText(k.username || "");
      const dNorm = normalizeText(k.display_name || "");
      const pNorm = (k.contact_phone || "").replace(/\s+/g, "");
      const platNorm = normalizeText(k.platform || "");
      return (
        uNorm.includes(query) ||
        dNorm.includes(query) ||
        pNorm.includes(query) ||
        platNorm.includes(query)
      );
    });
  }, [kols, search]);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setHighlightIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < filteredKols.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filteredKols.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredKols[highlightIndex]) {
        onChange(filteredKols[highlightIndex].id);
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const activeEl = listRef.current.children[highlightIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors shadow-2xs text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        {selectedKol ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
              {selectedKol.display_name
                ? selectedKol.display_name.charAt(0).toUpperCase()
                : selectedKol.username?.charAt(0).toUpperCase() || "?"}
              <span className="absolute -bottom-0.5 -right-0.5">
                <PlatformIcon platform={selectedKol.platform || "tiktok"} size="xs" />
              </span>
            </div>
            <div className="min-w-0 flex-1 truncate">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                @{selectedKol.username}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate block">
                {selectedKol.display_name || selectedKol.contact_phone || selectedKol.platform}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-zinc-400 italic flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {placeholder}
          </span>
        )}

        <svg
          className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Searchable Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 z-50 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Header */}
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40">
            <div className="relative flex items-center">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightIndex(0);
                }}
                placeholder="Tìm theo @username, tên, SĐT..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1 mt-1">
              <span>{filteredKols.length} kết quả</span>
              <span>Dùng phím ↑ ↓ Enter để chọn</span>
            </div>
          </div>

          {/* KOL List */}
          <div ref={listRef} className="max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 p-1">
            {filteredKols.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400">
                Không tìm thấy KOL &quot;{search}&quot;
              </div>
            ) : (
              filteredKols.map((kol, index) => {
                const isSelected = kol.id === value;
                const isHighlighted = index === highlightIndex;

                return (
                  <div
                    key={kol.id}
                    onClick={() => {
                      onChange(kol.id);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightIndex(index)}
                    className={`flex items-center justify-between gap-2 p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                      isHighlighted
                        ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100"
                        : isSelected
                        ? "bg-zinc-50 dark:bg-zinc-800/40 font-semibold"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="relative w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
                        {kol.display_name
                          ? kol.display_name.charAt(0).toUpperCase()
                          : kol.username?.charAt(0).toUpperCase() || "?"}
                        <span className="absolute -bottom-0.5 -right-0.5">
                          <PlatformIcon platform={kol.platform || "tiktok"} size="xs" />
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            @{kol.username}
                          </span>
                          {kol.platform && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 capitalize">
                              {kol.platform}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {kol.display_name && <span>{kol.display_name}</span>}
                          {kol.contact_phone && (
                            <span className="font-mono ml-1.5 text-zinc-400">
                              • {kol.contact_phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
