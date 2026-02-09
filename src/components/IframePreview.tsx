"use client";

import { useState } from "react";

export function IframePreview({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-white">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}
      <iframe
        src={`/render/${slug}`}
        sandbox="allow-scripts"
        className="h-[600px] w-full"
        onLoad={() => setLoading(false)}
        title="Artifact Preview"
      />
    </div>
  );
}
