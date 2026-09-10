"use client";

import { useState, useRef, useEffect } from "react";
import type { ColumnId, ViewPreset } from "./types";
import { AVAILABLE_COLUMNS, VIEW_PRESETS } from "./types";

interface ColumnCustomizerProps {
  visibleColumns: ColumnId[];
  onChangeColumns: (columns: ColumnId[]) => void;
  activePreset: ViewPreset | "custom";
  onSelectPreset: (preset: ViewPreset) => void;
}

export default function ColumnCustomizer({
  visibleColumns,
  onChangeColumns,
  activePreset,
  onSelectPreset,
}: ColumnCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const toggleColumn = (colId: ColumnId) => {
    const colDef = AVAILABLE_COLUMNS.find((c) => c.id === colId);
    if (colDef?.required) return; // Cannot toggle required columns

    if (visibleColumns.includes(colId)) {
      onChangeColumns(visibleColumns.filter((id) => id !== colId));
    } else {
      onChangeColumns([...visibleColumns, colId]);
    }
  };

  const handleReset = () => {
    onSelectPreset("all");
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 transition-all cursor-pointer shadow-2xs"
        title="Tùy biến cột hiển thị và chế độ xem"
      >
        <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        <span>Cột hiển thị ({visibleColumns.length})</span>
        <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-80 z-50 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Tùy biến chế độ xem bảng
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
            >
              Đặt lại
            </button>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              Mẫu xem nhanh (Presets)
            </span>
            <div className="grid grid-cols-2 gap-1">
              {(Object.keys(VIEW_PRESETS) as ViewPreset[]).map((pKey) => {
                const p = VIEW_PRESETS[pKey];
                const isActive = activePreset === pKey;
                return (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => onSelectPreset(pKey)}
                    className={`flex items-center gap-1.5 p-1.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800/80 shadow-2xs"
                        : "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent"
                    }`}
                  >
                    <span>{p.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{p.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column Toggles list */}
          <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider pb-1">
              <span>Danh sách các cột</span>
              <span>{visibleColumns.length} / {AVAILABLE_COLUMNS.length}</span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
              {AVAILABLE_COLUMNS.map((col) => {
                const isChecked = visibleColumns.includes(col.id);
                return (
                  <label
                    key={col.id}
                    className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition cursor-pointer ${
                      col.required
                        ? "opacity-60 cursor-not-allowed bg-zinc-50 dark:bg-zinc-800/40"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={col.required}
                        onChange={() => toggleColumn(col.id)}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {col.label}
                      </span>
                    </div>

                    {col.required && (
                      <span className="text-[10px] text-zinc-400 font-mono italic">
                        Cố định
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
