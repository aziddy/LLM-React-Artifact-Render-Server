"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tag } from "@/lib/tags";
import { TagBadge } from "./TagBadge";

interface FlatPickerTag {
  id: number;
  name: string;
  color: string | null;
  depth: number;
}

function flattenTags(tags: Tag[], depth = 0): FlatPickerTag[] {
  const result: FlatPickerTag[] = [];
  for (const tag of tags) {
    result.push({ id: tag.id, name: tag.name, color: tag.color, depth });
    if (tag.children?.length) {
      result.push(...flattenTags(tag.children, depth + 1));
    }
  }
  return result;
}

export function TagPicker({
  selectedTagIds,
  onChange,
  disabled,
}: {
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
  disabled?: boolean;
}) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [flatTags, setFlatTags] = useState<FlatPickerTag[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch tags on mount
  useEffect(() => {
    fetch("/api/tags")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Tag[]) => {
        setAllTags(data);
        setFlatTags(flattenTags(data));
      })
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const selectedSet = new Set(selectedTagIds);

  function toggle(id: number) {
    if (selectedSet.has(id)) {
      onChange(selectedTagIds.filter((tid) => tid !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  }

  // Build a lookup for selected tag info
  const tagLookup = new Map<number, FlatPickerTag>();
  for (const ft of flatTags) {
    tagLookup.set(ft.id, ft);
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Selected tags + trigger */}
      <div className="flex flex-wrap items-center gap-1.5">
        {selectedTagIds.map((id) => {
          const t = tagLookup.get(id);
          if (!t) return null;
          return (
            <TagBadge
              key={id}
              tag={t}
              onRemove={disabled ? undefined : () => toggle(id)}
            />
          );
        })}

        {!disabled && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-border-hover hover:text-text-secondary"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Add tags...
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-20 mt-2 max-h-56 w-64 overflow-y-auto rounded-lg border border-border bg-surface shadow-xl"
          >
            {flatTags.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-text-muted">
                No tags yet
              </div>
            ) : (
              flatTags.map((ft) => {
                const isSelected = selectedSet.has(ft.id);
                return (
                  <button
                    key={ft.id}
                    type="button"
                    onClick={() => toggle(ft.id)}
                    className={`flex w-full items-center justify-between text-left text-sm transition-colors hover:bg-surface-hover ${
                      isSelected
                        ? "text-text-primary"
                        : "text-text-secondary"
                    }`}
                    style={{
                      paddingLeft: ft.depth * 16 + 12,
                      paddingRight: 12,
                      paddingTop: 8,
                      paddingBottom: 8,
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            ft.color || "var(--color-text-muted)",
                        }}
                      />
                      {ft.name}
                    </span>
                    {isSelected && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-accent"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
