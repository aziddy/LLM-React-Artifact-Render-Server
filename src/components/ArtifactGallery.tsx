"use client";

import { motion } from "framer-motion";
import { ArtifactCard } from "./ArtifactCard";
import type { ArtifactListItem } from "@/lib/artifacts";

export function ArtifactGallery({
  artifacts,
}: {
  artifacts: ArtifactListItem[];
}) {
  if (artifacts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
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
            <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
          </svg>
        </div>
        <p className="text-text-secondary">No artifacts yet</p>
        <p className="mt-1 text-sm text-text-muted">
          Upload your first React artifact to get started
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {artifacts.map((artifact, index) => (
        <ArtifactCard key={artifact.id} artifact={artifact} index={index} />
      ))}
    </motion.div>
  );
}
