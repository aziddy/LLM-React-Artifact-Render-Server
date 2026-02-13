"use client";

import type { Tag } from "@/lib/tags";

export function TagBadge({
  tag,
  onClick,
  onRemove,
}: {
  tag: Pick<Tag, "id" | "name" | "color">;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  const color = tag.color || "var(--color-text-muted)";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
        onClick ? "cursor-pointer hover:brightness-125" : ""
      }`}
      style={{
        borderColor: tag.color || "var(--color-border)",
        color,
        backgroundColor: tag.color ? tag.color + "15" : "transparent",
      }}
      onClick={onClick}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/10"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
