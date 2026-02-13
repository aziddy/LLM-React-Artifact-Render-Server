"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tag } from "@/lib/tags";

const PRESET_COLORS = [
  { color: "#EF4444", label: "Red" },
  { color: "#F87171", label: "Red Light" },
  { color: "#FCA5A5", label: "Red Lighter" },
  { color: "#FECACA", label: "Red Lightest" },
  { color: "#EC4899", label: "Pink" },
  { color: "#F472B6", label: "Pink Light" },
  { color: "#F9A8D4", label: "Pink Lighter" },
  { color: "#FBCFE8", label: "Pink Lightest" },
  { color: "#F97316", label: "Orange" },
  { color: "#FB923C", label: "Orange Light" },
  { color: "#FDBA74", label: "Orange Lighter" },
  { color: "#FED7AA", label: "Orange Lightest" },
  { color: "#F59E0B", label: "Amber" },
  { color: "#FBBF24", label: "Amber Light" },
  { color: "#FCD34D", label: "Amber Lighter" },
  { color: "#FDE68A", label: "Amber Lightest" },
  { color: "#84CC16", label: "Lime" },
  { color: "#BEF264", label: "Lime Light" },
  { color: "#10B981", label: "Emerald" },
  { color: "#34D399", label: "Emerald Light" },
  { color: "#6EE7B7", label: "Emerald Lighter" },
  { color: "#14B8A6", label: "Teal" },
  { color: "#2DD4BF", label: "Teal Light" },
  { color: "#5EEAD4", label: "Teal Lighter" },
  { color: "#99F6E4", label: "Teal Lightest" },
  { color: "#3B82F6", label: "Blue" },
  { color: "#60A5FA", label: "Blue Light" },
  { color: "#93C5FD", label: "Blue Lighter" },
  { color: "#BFDBFE", label: "Blue Lightest" },
  { color: "#0EA5E9", label: "Sky" },
  { color: "#38BDF8", label: "Sky Light" },
  { color: "#8B5CF6", label: "Violet" },
  { color: "#A78BFA", label: "Violet Light" },
  { color: "#C4B5FD", label: "Violet Lighter" },
  { color: "#DDD6FE", label: "Violet Lightest" },
  { color: "#6366F1", label: "Indigo" },
  { color: "#64748B", label: "Slate" },
  { color: "#94A3B8", label: "Slate Light" },
  { color: "#CBD5E1", label: "Slate Lighter" },
];

function collectDescendantIds(tag: Tag): Set<number> {
  const ids = new Set<number>();
  function walk(t: Tag) {
    ids.add(t.id);
    t.children?.forEach(walk);
  }
  walk(tag);
  return ids;
}

function flattenForPicker(
  tags: Tag[],
  excludeIds: Set<number>,
  depth = 0
): { tag: Tag; depth: number }[] {
  const result: { tag: Tag; depth: number }[] = [];
  for (const tag of tags) {
    if (!excludeIds.has(tag.id)) {
      result.push({ tag, depth });
      if (tag.children?.length) {
        result.push(...flattenForPicker(tag.children, excludeIds, depth + 1));
      }
    }
  }
  return result;
}

export function TagForm({
  open,
  onClose,
  onSave,
  tag,
  allTags,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    color: string | null;
    parent_id: number | null;
  }) => void;
  tag?: Tag | null;
  allTags: Tag[];
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [showParentPicker, setShowParentPicker] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const customColorRef = useRef<HTMLInputElement>(null);
  const parentPickerRef = useRef<HTMLDivElement>(null);

  // Reset form when tag changes or dialog opens
  useEffect(() => {
    if (open) {
      setName(tag?.name || "");
      setColor(tag?.color || null);
      setParentId(tag?.parent_id || null);
      setError("");
      setLoading(false);
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [open, tag]);

  // Close parent picker on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        parentPickerRef.current &&
        !parentPickerRef.current.contains(e.target as Node)
      ) {
        setShowParentPicker(false);
      }
    }
    if (showParentPicker) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [showParentPicker]);

  const excludeIds = tag ? collectDescendantIds(tag) : new Set<number>();
  const parentOptions = flattenForPicker(allTags, excludeIds);
  const selectedParent = parentOptions.find((o) => o.tag.id === parentId);

  const isCustomColor =
    color && !PRESET_COLORS.some((p) => p.color === color);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (name.length > 100) {
      setError("Name must be 100 characters or less");
      return;
    }

    setLoading(true);
    try {
      await onSave({ name: name.trim(), color, parent_id: parentId });
      onClose();
    } catch {
      setError("Failed to save tag");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl"
          >
            <h2 className="mb-5 text-lg font-semibold text-text-primary">
              {tag ? "Edit Tag" : "Create Tag"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Name
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
                  placeholder="e.g. Dashboard, Charts, Games..."
                  maxLength={100}
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  Color{" "}
                  <span className="text-text-muted">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {/* No color option */}
                  <button
                    type="button"
                    onClick={() => setColor(null)}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                      color === null
                        ? "border-text-secondary scale-110"
                        : "border-border hover:border-border-hover"
                    }`}
                    title="No color"
                  >
                    {color === null && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-text-secondary"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setColor(preset.color)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                        color === preset.color
                          ? "scale-110 ring-2 ring-white/30"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: preset.color }}
                      title={preset.label}
                    >
                      {color === preset.color && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}

                  {/* Custom color */}
                  <button
                    type="button"
                    onClick={() => customColorRef.current?.click()}
                    className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                      isCustomColor
                        ? "scale-110 ring-2 ring-white/30"
                        : "hover:scale-110"
                    }`}
                    style={{
                      background: isCustomColor
                        ? color!
                        : "conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #8b5cf6, #ec4899, #ef4444)",
                    }}
                    title="Custom color"
                  >
                    {isCustomColor && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={customColorRef}
                    type="color"
                    className="invisible absolute h-0 w-0"
                    value={color || "#6366f1"}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
              </div>

              {/* Parent picker */}
              <div ref={parentPickerRef} className="relative">
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Parent tag{" "}
                  <span className="text-text-muted">(optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowParentPicker(!showParentPicker)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-border-hover focus:border-accent focus:outline-none"
                >
                  <span
                    className={
                      selectedParent
                        ? "text-text-primary"
                        : "text-text-muted"
                    }
                  >
                    {selectedParent ? (
                      <span className="flex items-center gap-2">
                        {selectedParent.tag.color && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: selectedParent.tag.color,
                            }}
                          />
                        )}
                        {selectedParent.tag.name}
                      </span>
                    ) : (
                      "None (root tag)"
                    )}
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-text-muted"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                <AnimatePresence>
                  {showParentPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-surface shadow-xl"
                    >
                      {/* None option */}
                      <button
                        type="button"
                        onClick={() => {
                          setParentId(null);
                          setShowParentPicker(false);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface-hover"
                      >
                        None (root tag)
                        {parentId === null && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-accent"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>

                      {parentOptions.map(({ tag: t, depth }) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setParentId(t.id);
                            setShowParentPicker(false);
                          }}
                          className="flex w-full items-center justify-between text-left text-sm text-text-primary transition-colors hover:bg-surface-hover"
                          style={{
                            paddingLeft: depth * 16 + 12,
                            paddingRight: 12,
                            paddingTop: 8,
                            paddingBottom: 8,
                          }}
                        >
                          <span className="flex items-center gap-2">
                            {t.color && (
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: t.color }}
                              />
                            )}
                            {t.name}
                            {t.artifact_count != null && (
                              <span className="text-xs text-text-muted">
                                {t.artifact_count}
                              </span>
                            )}
                          </span>
                          {parentId === t.id && (
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
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
                >
                  {error}
                </motion.p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : tag
                      ? "Save Changes"
                      : "Create Tag"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
