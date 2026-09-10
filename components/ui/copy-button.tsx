"use client";

import React, { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
  title?: string;
  className?: string;
  size?: "xs" | "sm";
}

export default function CopyButton({
  text,
  label,
  title = "Sao chép",
  className = "",
  size = "xs",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const iconSize = size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5";
  const btnPadding = size === "xs" ? "p-1" : "p-1.5";

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Đã sao chép!" : title}
      className={`inline-flex items-center gap-1 rounded-md transition-all cursor-pointer select-none ${btnPadding} ${
        copied
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 scale-105"
          : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      } ${className}`}
    >
      {copied ? (
        <svg
          className={`${iconSize} text-emerald-600 dark:text-emerald-400 animate-in zoom-in duration-150`}
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
      ) : (
        <svg
          className={iconSize}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
      {label && <span className="text-[10px] font-medium">{label}</span>}
    </button>
  );
}
