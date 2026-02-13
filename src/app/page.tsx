import { Suspense } from "react";
import { listArtifactsWithTags } from "@/lib/artifacts";
import { getTagTreeWithCounts } from "@/lib/tags";
import { Navbar } from "@/components/Navbar";
import { ArtifactGallery } from "@/components/ArtifactGallery";
import { SearchBar } from "@/components/SearchBar";
import { TagFilter } from "@/components/TagFilter";
import Link from "next/link";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tag?: string }>;
}) {
  const { search, tag } = await searchParams;
  const tagId = tag ? Number(tag) : undefined;

  const artifacts = listArtifactsWithTags({
    includePrivate: true,
    search,
    tagId,
  });

  const allTags = getTagTreeWithCounts();

  return (
    <div className="min-h-screen">
      <Navbar isLoggedIn={true} />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Your Artifacts
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {artifacts.length} artifact{artifacts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5v14" />
            </svg>
            Upload Artifact
          </Link>
        </div>

        <div className="mb-6 flex flex-col gap-4">
          <Suspense>
            <SearchBar />
          </Suspense>
          {allTags.length > 0 && (
            <Suspense>
              <TagFilter tags={allTags} activeTagId={tagId} />
            </Suspense>
          )}
        </div>

        <ArtifactGallery artifacts={artifacts} />
      </main>
    </div>
  );
}
