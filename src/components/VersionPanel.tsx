"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { IframePreview } from "./IframePreview";
import { DiffView } from "./DiffView";

interface VersionListItem {
  id: number;
  artifact_id: number;
  version_number: number;
  title: string;
  description: string;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr + "Z").getTime();
  const seconds = Math.floor((now - date) / 1000);
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

export function VersionPanel({
  artifactId,
  artifactSlug,
  liveVersion,
  onLiveVersionChange,
}: {
  artifactId: number;
  artifactSlug: string;
  liveVersion: number;
  onLiveVersionChange?: () => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [versions, setVersions] = useState<VersionListItem[]>([]);
  const [liveVer, setLiveVer] = useState(liveVersion);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [settingLive, setSettingLive] = useState<number | null>(null);

  // Preview state
  const [previewVersion, setPreviewVersion] = useState<number | null>(null);

  // Diff state
  const [diffVersions, setDiffVersions] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const [diffData, setDiffData] = useState<{
    oldCode: string;
    newCode: string;
    oldLabel: string;
    newLabel: string;
  } | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  // Diff "from" picker
  const [pickingDiffFor, setPickingDiffFor] = useState<number | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/artifacts/${artifactId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions);
        setLiveVer(data.live_version);
      }
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [artifactId]);

  useEffect(() => {
    if (expanded && !fetched) {
      fetchVersions();
    }
  }, [expanded, fetched, fetchVersions]);

  function handleNewVersion() {
    router.push(`/artifact/${artifactSlug}/edit?new=true`);
  }

  async function handleSetLive(versionNumber: number) {
    setSettingLive(versionNumber);
    try {
      const res = await fetch(
        `/api/artifacts/${artifactId}/versions/${versionNumber}`,
        { method: "POST" }
      );
      if (res.ok) {
        setLiveVer(versionNumber);
        onLiveVersionChange?.();
        router.refresh();
      }
    } finally {
      setSettingLive(null);
    }
  }

  function handlePreview(versionNumber: number) {
    if (previewVersion === versionNumber) {
      setPreviewVersion(null);
    } else {
      setPreviewVersion(versionNumber);
      setDiffVersions(null);
      setDiffData(null);
    }
  }

  async function handleDiff(fromVersion: number, toVersion: number) {
    setDiffLoading(true);
    setPreviewVersion(null);
    setPickingDiffFor(null);

    const [lo, hi] =
      fromVersion < toVersion
        ? [fromVersion, toVersion]
        : [toVersion, fromVersion];

    try {
      const [oldRes, newRes] = await Promise.all([
        fetch(`/api/artifacts/${artifactId}/versions/${lo}`),
        fetch(`/api/artifacts/${artifactId}/versions/${hi}`),
      ]);

      if (oldRes.ok && newRes.ok) {
        const oldData = await oldRes.json();
        const newData = await newRes.json();
        setDiffVersions({ from: lo, to: hi });
        setDiffData({
          oldCode: oldData.code,
          newCode: newData.code,
          oldLabel: `v${lo}`,
          newLabel: `v${hi}`,
        });
      }
    } finally {
      setDiffLoading(false);
    }
  }

  function handleDiffClick(versionNumber: number) {
    if (versions.length < 2) return;

    const idx = versions.findIndex(
      (v) => v.version_number === versionNumber
    );
    const prevVersion = versions[idx + 1]; // versions sorted DESC

    if (prevVersion) {
      handleDiff(prevVersion.version_number, versionNumber);
    } else {
      setPickingDiffFor(versionNumber);
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <motion.svg
            animate={{ rotate: expanded ? 90 : 0 }}
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
          Versions
          {versions.length > 0 && (
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted">
              {versions.length}
            </span>
          )}
        </button>

        {expanded && (
          <button
            onClick={handleNewVersion}
            className="rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-accent hover:text-accent"
          >
            + New Version
          </button>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : versions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-8 text-center">
                  <p className="text-sm text-text-muted mb-3">
                    No versions yet
                  </p>
                  <button
                    onClick={handleNewVersion}
                    className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
                  >
                    Create First Version
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {versions.map((v) => {
                    const isLive = v.version_number === liveVer;
                    return (
                      <div
                        key={v.id}
                        className={`rounded-lg border px-4 py-3 transition-colors ${
                          isLive
                            ? "border-success/30 bg-success/5"
                            : "border-border bg-surface/50 hover:border-border-hover"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="shrink-0 rounded-md bg-surface px-2 py-0.5 text-xs font-mono text-text-secondary border border-border">
                            v{v.version_number}
                          </span>

                          <div className="min-w-0 flex-1">
                            <span className="text-sm text-text-primary truncate block">
                              {v.title}
                            </span>
                          </div>

                          <span className="shrink-0 text-xs text-text-muted">
                            {timeAgo(v.created_at)}
                          </span>

                          {isLive && (
                            <span className="shrink-0 rounded-full bg-success/20 px-2.5 py-0.5 text-xs font-medium text-success">
                              LIVE
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <Link
                            href={`/artifact/${artifactSlug}/edit?v=${v.version_number}`}
                            className="rounded-md border border-border px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-border-hover hover:text-text-secondary"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() => handlePreview(v.version_number)}
                            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                              previewVersion === v.version_number
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border text-text-muted hover:border-border-hover hover:text-text-secondary"
                            }`}
                          >
                            {previewVersion === v.version_number
                              ? "Hide Preview"
                              : "Preview"}
                          </button>

                          {versions.length > 1 && (
                            <>
                              <button
                                onClick={() =>
                                  handleDiffClick(v.version_number)
                                }
                                disabled={diffLoading}
                                className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                                  diffVersions &&
                                  (diffVersions.from === v.version_number ||
                                    diffVersions.to === v.version_number)
                                    ? "border-accent bg-accent/10 text-accent"
                                    : "border-border text-text-muted hover:border-border-hover hover:text-text-secondary"
                                } disabled:opacity-50`}
                              >
                                {diffLoading ? "Loading..." : "Diff"}
                              </button>

                              {pickingDiffFor === v.version_number && (
                                <span className="flex items-center gap-1 text-xs text-text-muted">
                                  with:
                                  {versions
                                    .filter(
                                      (other) =>
                                        other.version_number !==
                                        v.version_number
                                    )
                                    .map((other) => (
                                      <button
                                        key={other.id}
                                        onClick={() =>
                                          handleDiff(
                                            other.version_number,
                                            v.version_number
                                          )
                                        }
                                        className="rounded bg-surface px-1.5 py-0.5 text-xs font-mono text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                                      >
                                        v{other.version_number}
                                      </button>
                                    ))}
                                </span>
                              )}
                            </>
                          )}

                          {!isLive && (
                            <button
                              onClick={() => handleSetLive(v.version_number)}
                              disabled={settingLive === v.version_number}
                              className="rounded-md border border-success/30 px-2.5 py-1 text-xs text-success transition-colors hover:bg-success/10 disabled:opacity-50"
                            >
                              {settingLive === v.version_number
                                ? "Setting..."
                                : "Set Live"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Preview area */}
              <AnimatePresence>
                {previewVersion !== null && (
                  <motion.div
                    key={`preview-${previewVersion}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-text-secondary">
                          Preview — v{previewVersion}
                        </span>
                        <button
                          onClick={() => setPreviewVersion(null)}
                          className="text-xs text-text-muted hover:text-text-secondary"
                        >
                          Close
                        </button>
                      </div>
                      <IframePreview
                        src={`/render/${artifactSlug}/version/${previewVersion}`}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Diff area */}
              <AnimatePresence>
                {diffData && (
                  <motion.div
                    key={`diff-${diffVersions?.from}-${diffVersions?.to}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-text-secondary">
                          Code Diff
                        </span>
                        <button
                          onClick={() => {
                            setDiffVersions(null);
                            setDiffData(null);
                          }}
                          className="text-xs text-text-muted hover:text-text-secondary"
                        >
                          Close
                        </button>
                      </div>
                      <DiffView {...diffData} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
