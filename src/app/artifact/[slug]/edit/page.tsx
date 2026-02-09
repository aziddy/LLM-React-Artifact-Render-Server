"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { CodeEditor } from "@/components/CodeEditor";
import { VisibilityToggle } from "@/components/VisibilityToggle";
import type { Artifact } from "@/lib/artifacts";

export default function EditArtifactPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch(`/api/artifacts/by-slug/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: Artifact) => {
        setArtifact(data);
        setTitle(data.title);
        setDescription(data.description);
        setCode(data.code);
        setVisibility(data.visibility);
        setFetching(false);
      })
      .catch(() => {
        router.push("/");
      });
  }, [slug, router]);

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
      const res = await fetch(`/api/artifacts/${artifact!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, code, visibility }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update artifact");
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
            Edit Artifact
          </h1>
          <p className="mb-8 text-sm text-text-secondary">
            Update your React/JSX artifact
          </p>

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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Visibility
              </label>
              <VisibilityToggle value={visibility} onChange={setVisibility} />
            </div>

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
                {loading ? "Saving..." : "Save Changes"}
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
