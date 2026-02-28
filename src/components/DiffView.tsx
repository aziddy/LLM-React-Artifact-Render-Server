"use client";

import { useMemo } from "react";
import { diffLines } from "diff";

export function DiffView({
  oldCode,
  newCode,
  oldLabel,
  newLabel,
}: {
  oldCode: string;
  newCode: string;
  oldLabel: string;
  newLabel: string;
}) {
  const changes = useMemo(() => diffLines(oldCode, newCode), [oldCode, newCode]);

  // Compute line numbers
  const lines = useMemo(() => {
    const result: {
      type: "added" | "removed" | "unchanged";
      content: string;
      oldLine: number | null;
      newLine: number | null;
    }[] = [];
    let oldLine = 1;
    let newLine = 1;

    for (const change of changes) {
      const changeLines = change.value.replace(/\n$/, "").split("\n");
      for (const line of changeLines) {
        if (change.added) {
          result.push({ type: "added", content: line, oldLine: null, newLine });
          newLine++;
        } else if (change.removed) {
          result.push({
            type: "removed",
            content: line,
            oldLine,
            newLine: null,
          });
          oldLine++;
        } else {
          result.push({ type: "unchanged", content: line, oldLine, newLine });
          oldLine++;
          newLine++;
        }
      }
    }
    return result;
  }, [changes]);

  const hasChanges = changes.some((c) => c.added || c.removed);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2">
        <span className="text-xs font-mono text-danger">{oldLabel}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-muted"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span className="text-xs font-mono text-success">{newLabel}</span>
        {!hasChanges && (
          <span className="ml-auto text-xs text-text-muted">No changes</span>
        )}
      </div>

      {/* Diff content */}
      <div className="max-h-[500px] overflow-auto font-mono text-xs leading-5">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`flex ${
              line.type === "added"
                ? "bg-success/10"
                : line.type === "removed"
                  ? "bg-danger/10"
                  : ""
            }`}
          >
            {/* Old line number */}
            <span className="w-10 shrink-0 select-none px-2 text-right text-text-muted/50">
              {line.oldLine ?? ""}
            </span>
            {/* New line number */}
            <span className="w-10 shrink-0 select-none px-2 text-right text-text-muted/50">
              {line.newLine ?? ""}
            </span>
            {/* Indicator */}
            <span
              className={`w-5 shrink-0 select-none text-center ${
                line.type === "added"
                  ? "text-success"
                  : line.type === "removed"
                    ? "text-danger"
                    : "text-transparent"
              }`}
            >
              {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
            </span>
            {/* Content */}
            <span
              className={`flex-1 whitespace-pre pr-4 ${
                line.type === "added"
                  ? "text-success"
                  : line.type === "removed"
                    ? "text-danger"
                    : "text-text-secondary"
              }`}
            >
              {line.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
