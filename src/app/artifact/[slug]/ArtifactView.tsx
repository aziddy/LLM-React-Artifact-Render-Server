"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { VisibilityBadge } from "@/components/VisibilityBadge";
import { IframePreview } from "@/components/IframePreview";
import { CodeEditor } from "@/components/CodeEditor";
import { TagBadge } from "@/components/TagBadge";
import type { Artifact } from "@/lib/artifacts";
import type { Tag } from "@/lib/tags";

export function ArtifactView({
  artifact,
  isLoggedIn,
}: {
  artifact: Artifact & { tags?: Tag[] };
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this artifact?")) return;
    setDeleting(true);

    const res = await fetch(`/api/artifacts/${artifact.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.push("/");
    } else {
      setDeleting(false);
      alert("Failed to delete artifact");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(artifact.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen">
      <Navbar isLoggedIn={isLoggedIn} />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-secondary"
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
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to Gallery
            </Link>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  {artifact.title}
                </h1>
                {artifact.description && (
                  <p className="mt-1 text-text-secondary">
                    {artifact.description}
                  </p>
                )}
                {artifact.tags && artifact.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {artifact.tags.map((tag) => (
                      <TagBadge key={tag.id} tag={tag} />
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-3">
                  <VisibilityBadge visibility={artifact.visibility} />
                  <span className="text-xs text-text-muted">
                    Created{" "}
                    {new Date(artifact.created_at + "Z").toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </span>
                </div>
              </div>

              {isLoggedIn && (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/artifact/${artifact.slug}/edit`}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-lg border border-danger/30 px-3 py-1.5 text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-text-secondary">
                Preview
              </h2>
              <a
                href={`/render/${artifact.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-secondary"
              >
                Open in new tab
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
                  <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                </svg>
              </a>
            </div>
            <IframePreview slug={artifact.slug} />
          </div>

          {/* Code section */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setShowCode(!showCode)}
                className="flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                <motion.svg
                  animate={{ rotate: showCode ? 90 : 0 }}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </motion.svg>
                Source Code
              </button>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-border-hover hover:text-text-secondary"
              >
                {copied ? (
                  <>
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
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
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
                      <rect
                        width="14"
                        height="14"
                        x="8"
                        y="8"
                        rx="2"
                        ry="2"
                      />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    Copy Code
                  </>
                )}
              </button>
            </div>
            {showCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CodeEditor value={artifact.code} readOnly />
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
