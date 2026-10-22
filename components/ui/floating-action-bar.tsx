"use client";

import React, { useEffect } from "react";

export interface FloatingActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  shortcut?: string;
  title?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export interface FloatingActionBarProps {
  primaryAction?: FloatingActionItem;
  secondaryActions?: FloatingActionItem[];
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export default function FloatingActionBar({
  primaryAction,
  secondaryActions = [],
  badge,
  children,
  className = "",
}: FloatingActionBarProps) {
  // Global shortcut listener (e.g., press 'N' or 'C' when not typing in inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (document.querySelector('[role="dialog"], [aria-modal="true"]')) {
        return;
      }

      const key = e.key.toLowerCase();

      // Check primary action shortcut
      if (
        primaryAction?.shortcut &&
        !primaryAction.disabled &&
        key === primaryAction.shortcut.toLowerCase()
      ) {
        e.preventDefault();
        primaryAction.onClick();
        return;
      }

      // Check secondary actions shortcut
      for (const action of secondaryActions) {
        if (
          action.shortcut &&
          !action.disabled &&
          key === action.shortcut.toLowerCase()
        ) {
          e.preventDefault();
          action.onClick();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [primaryAction, secondaryActions]);

  if (!primaryAction && secondaryActions.length === 0 && !children && !badge) {
    return null;
  }

  return (
    <nav
      aria-label="Thao tác nổi"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1 rounded-full bg-zinc-950/85 dark:bg-[#111218]/90 backdrop-blur-xl border border-white/15 dark:border-white/10 shadow-2xl shadow-black/40 text-white select-none max-w-[calc(100vw-2rem)] transition-all duration-200 ring-1 ring-black/10 dark:ring-white/[0.04] animate-in fade-in slide-in-from-bottom-3 ${className}`}
    >
      {/* Badge / Info Pill (Optional) */}
      {badge && (
        <div className="pl-3 pr-2 text-xs font-medium text-zinc-300 flex items-center gap-1.5">
          {badge}
        </div>
      )}

      {badge && (primaryAction || secondaryActions.length > 0) && (
        <div className="h-4 w-px bg-white/15 mx-0.5" />
      )}

      {/* Primary Action Button */}
      {primaryAction && (
        <button
          type="button"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          title={
            primaryAction.title ||
            (primaryAction.shortcut
              ? `${primaryAction.label} (Phím ${primaryAction.shortcut.toUpperCase()})`
              : primaryAction.label)
          }
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
            primaryAction.variant === "danger"
              ? "bg-rose-600 hover:bg-rose-500 text-white shadow-xs shadow-rose-600/30"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs shadow-indigo-600/25"
          } ${primaryAction.disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
        >
          {primaryAction.icon || (
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          )}
          <span className="whitespace-nowrap">{primaryAction.label}</span>
          {primaryAction.shortcut && (
            <kbd className="hidden sm:inline-flex items-center justify-center min-w-[16px] h-3.5 px-1 text-[9px] font-semibold bg-white/20 text-white rounded font-mono">
              {primaryAction.shortcut.toUpperCase()}
            </kbd>
          )}
        </button>
      )}

      {/* Divider if we have secondary actions */}
      {primaryAction && secondaryActions.length > 0 && (
        <div className="h-4 w-px bg-white/15 mx-0.5" />
      )}

      {/* Secondary Actions */}
      {secondaryActions.map((action, index) => (
        <button
          key={index}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          title={
            action.title ||
            (action.shortcut
              ? `${action.label} (Phím ${action.shortcut.toUpperCase()})`
              : action.label)
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            action.active
              ? "bg-white/15 text-white font-semibold shadow-2xs"
              : "text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95"
          } ${action.disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
        >
          {action.icon}
          <span className="whitespace-nowrap">{action.label}</span>
          {action.shortcut && (
            <kbd className="hidden md:inline-flex items-center justify-center min-w-[15px] h-3.5 px-1 text-[9px] font-medium bg-white/15 text-zinc-300 rounded font-mono">
              {action.shortcut.toUpperCase()}
            </kbd>
          )}
        </button>
      ))}

      {/* Custom Children / Extra content */}
      {children}
    </nav>
  );
}
