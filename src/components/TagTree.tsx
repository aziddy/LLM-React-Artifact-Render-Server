"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tag } from "@/lib/tags";
import { TagBadge } from "./TagBadge";

function TagNode({
  tag,
  onEdit,
  onDelete,
}: {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
}) {
  const hasChildren = tag.children && tag.children.length > 0;
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-hover">
        {/* Expand/collapse chevron */}
        <button
          type="button"
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors ${
            hasChildren
              ? "text-text-muted hover:text-text-secondary"
              : "text-transparent"
          }`}
        >
          <motion.svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <polyline points="9 18 15 12 9 6" />
          </motion.svg>
        </button>

        {/* Tag badge */}
        <TagBadge tag={tag} />

        {/* Artifact count */}
        <span className="text-xs text-text-muted">
          {tag.artifact_count ?? 0} artifact
          {(tag.artifact_count ?? 0) !== 1 ? "s" : ""}
        </span>

        {/* Actions — visible on hover */}
        <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(tag)}
            className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(tag)}
            className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {hasChildren && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="ml-5 overflow-hidden border-l border-border pl-2"
          >
            {tag.children!.map((child) => (
              <TagNode
                key={child.id}
                tag={child}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TagTree({
  tags,
  onEdit,
  onDelete,
}: {
  tags: Tag[];
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
}) {
  if (tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted"
          >
            <path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <p className="text-sm text-text-secondary">No tags yet.</p>
        <p className="text-xs text-text-muted">
          Create one to organize your artifacts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {tags.map((tag) => (
        <TagNode key={tag.id} tag={tag} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
