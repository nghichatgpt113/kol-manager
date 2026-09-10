"use client";

import { useState, useRef, useEffect } from "react";

interface InlineNotesCellProps {
  bookingId: string;
  notes?: string | null;
  onUpdate: (notes: string | null) => Promise<void> | void;
}

export default function InlineNotesCell({
  notes,
  onUpdate,
}: InlineNotesCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempNotes, setTempNotes] = useState(notes || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempNotes(notes || "");
  }, [notes]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsEditing(false);
    if (tempNotes.trim() === (notes || "").trim()) return;
    setIsUpdating(true);
    try {
      await onUpdate(tempNotes.trim() || null);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setTempNotes(notes || "");
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div
        className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 min-w-[180px]"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={tempNotes}
          onChange={(e) => setTempNotes(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ghi chú nội bộ..."
          className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-zinc-900 dark:text-zinc-100 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSave}
          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded shrink-0 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => {
            setTempNotes(notes || "");
            setIsEditing(false);
          }}
          className="p-1 text-zinc-400 hover:bg-zinc-200 rounded shrink-0 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      className="group/note inline-flex items-center gap-1.5 text-xs text-left cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      title="Bấm để sửa ghi chú"
    >
      <span className="truncate max-w-[140px] text-zinc-600 dark:text-zinc-400 group-hover/note:underline">
        {notes || <span className="text-zinc-400 italic text-[11px]">+ Thêm ghi chú</span>}
      </span>
      <button
        type="button"
        className="opacity-0 group-hover/note:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>

      {isUpdating && (
        <svg className="w-3 h-3 animate-spin text-zinc-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
    </div>
  );
}
