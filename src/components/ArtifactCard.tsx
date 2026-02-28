"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { VisibilityBadge } from "./VisibilityBadge";
import { TagBadge } from "./TagBadge";
import type { ArtifactListItemWithTags } from "@/lib/artifacts";

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr + "Z");
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function ArtifactCard({
  artifact,
  index,
}: {
  artifact: ArtifactListItemWithTags;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={`/artifact/${artifact.slug}`}
        className="group block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-hover hover:bg-surface-hover"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-text-primary line-clamp-1 group-hover:text-accent-hover transition-colors">
            {artifact.title}
          </h3>
          <VisibilityBadge visibility={artifact.visibility} />
        </div>

        {artifact.description && (
          <p className="mb-4 text-sm text-text-secondary line-clamp-2">
            {artifact.description}
          </p>
        )}

        {artifact.tags && artifact.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {artifact.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-text-muted">
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
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {timeAgo(artifact.created_at)}
          {artifact.version_count > 0 && (
            <>
              <span className="text-text-muted/40">·</span>
              <span>
                {artifact.version_count} {artifact.version_count === 1 ? "version" : "versions"}
              </span>
              {artifact.live_version > 0 && (
                <>
                  <span className="text-text-muted/40">·</span>
                  <span>v{artifact.live_version} live</span>
                </>
              )}
            </>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
