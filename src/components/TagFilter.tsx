"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Tag } from "@/lib/tags";

function flattenTags(tags: Tag[]): Tag[] {
  const result: Tag[] = [];
  for (const tag of tags) {
    result.push(tag);
    if (tag.children?.length) {
      result.push(...flattenTags(tag.children));
    }
  }
  return result;
}

export function TagFilter({
  tags,
  activeTagId,
}: {
  tags: Tag[];
  activeTagId?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flat = flattenTags(tags);

  function handleClick(tagId?: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (tagId) {
      params.set("tag", String(tagId));
    } else {
      params.delete("tag");
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={() => handleClick()}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          !activeTagId
            ? "border-accent bg-accent/10 text-accent"
            : "border-border text-text-muted hover:border-border-hover hover:text-text-secondary"
        }`}
      >
        All
      </button>
      {flat.map((tag) => (
        <button
          key={tag.id}
          onClick={() => handleClick(tag.id)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            activeTagId === tag.id
              ? "scale-105"
              : "hover:brightness-125"
          }`}
          style={{
            borderColor:
              activeTagId === tag.id
                ? tag.color || "var(--color-accent)"
                : tag.color || "var(--color-border)",
            color: tag.color || "var(--color-text-muted)",
            backgroundColor:
              activeTagId === tag.id
                ? (tag.color || "var(--color-accent)") + "20"
                : "transparent",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: tag.color || "var(--color-text-muted)",
            }}
          />
          {tag.name}
          {tag.artifact_count != null && tag.artifact_count > 0 && (
            <span className="opacity-60">{tag.artifact_count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
