"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { CodeEditor } from "@/components/CodeEditor";
import { VisibilityToggle } from "@/components/VisibilityToggle";
import { TagPicker } from "@/components/TagPicker";
import type { Artifact } from "@/lib/artifacts";
import type { Tag } from "@/lib/tags";

export default function EditArtifactPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const versionParam = searchParams.get("v");
  const editingVersion = versionParam ? Number(versionParam) : null;
  const isNewVersion = searchParams.get("new") === "true";

  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [isLiveVersion, setIsLiveVersion] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">(
    "private"
  );
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    // Always fetch the artifact first (for id, slug, visibility, tags, live_version)
    fetch(`/api/artifacts/by-slug/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(async (data: Artifact & { tags?: Tag[] }) => {
        setArtifact(data);
        setVisibility(data.visibility);
        if (data.tags) {
          setSelectedTagIds(data.tags.map((t) => t.id));
        }

        if (editingVersion) {
          // Loading a specific version's content
          setIsLiveVersion(data.live_version === editingVersion);
          const vRes = await fetch(
            `/api/artifacts/${data.id}/versions/${editingVersion}`
          );
          if (!vRes.ok) throw new Error("Version not found");
          const vData = await vRes.json();
          setTitle(vData.title);
          setDescription(vData.description);
          setCode(vData.code);
        } else {
          // Editing artifact directly
          setIsLiveVersion(false);
          setTitle(data.title);
          setDescription(data.description);
          setCode(data.code);
        }

        setFetching(false);
      })
      .catch(() => {
        router.push("/");
      });
  }, [slug, editingVersion, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!code.trim()) {
      setError("Code is required");
      return;
    }

    setLoading(true);

    try {
      let res: Response;

      if (isNewVersion) {
        // Create a new version
        res = await fetch(
          `/api/artifacts/${artifact!.id}/versions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description, code }),
          }
        );
      } else if (editingVersion) {
        // Save to the specific version
        res = await fetch(
          `/api/artifacts/${artifact!.id}/versions/${editingVersion}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description, code }),
          }
        );
      } else {
        // Save to artifact directly
        res = await fetch(`/api/artifacts/${artifact!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            code,
            visibility,
            tagIds: selectedTagIds,
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        setLoading(false);
        return;
      }

      router.push(`/artifact/${slug}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen">
        <Navbar isLoggedIn={true} />
        <div className="flex items-center justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar isLoggedIn={true} />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="mb-2 text-2xl font-bold text-text-primary">
            {isNewVersion
              ? "New Version"
              : editingVersion
                ? "Edit Version"
                : "Edit Artifact"}
          </h1>

          {isNewVersion ? (
            <p className="mb-8 text-sm text-text-secondary">
              Create a new version of this artifact
            </p>
          ) : editingVersion ? (
            <div className="mb-8 flex items-center gap-2">
              <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-mono text-text-secondary border border-border">
                v{editingVersion}
              </span>
              {isLiveVersion && (
                <span className="rounded-full bg-success/20 px-2.5 py-0.5 text-xs font-medium text-success">
                  LIVE
                </span>
              )}
              <span className="text-sm text-text-muted">
                {isLiveVersion
                  ? "Changes will update the live artifact"
                  : "Changes won't affect the live artifact"}
              </span>
            </div>
          ) : (
            <p className="mb-8 text-sm text-text-secondary">
              Update your React/JSX artifact
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Description{" "}
                <span className="text-text-muted">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none resize-none"
              />
            </div>

            {/* Visibility and Tags only shown when editing artifact directly */}
            {!editingVersion && !isNewVersion && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    Visibility
                  </label>
                  <VisibilityToggle
                    value={visibility}
                    onChange={setVisibility}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    Tags{" "}
                    <span className="text-text-muted">(optional)</span>
                  </label>
                  <TagPicker
                    selectedTagIds={selectedTagIds}
                    onChange={setSelectedTagIds}
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Code
              </label>
              <CodeEditor value={code} onChange={setCode} />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {error}
              </motion.p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {loading
                  ? "Saving..."
                  : isNewVersion
                    ? "Create Version"
                    : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/artifact/${slug}`)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
