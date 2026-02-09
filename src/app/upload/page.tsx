"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { CodeEditor } from "@/components/CodeEditor";
import { VisibilityToggle } from "@/components/VisibilityToggle";

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const res = await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, code, visibility }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create artifact");
        setLoading(false);
        return;
      }

      const artifact = await res.json();
      router.push(`/artifact/${artifact.slug}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
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
            Upload Artifact
          </h1>
          <p className="mb-8 text-sm text-text-secondary">
            Paste your React/JSX artifact code from Claude
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
                placeholder="My Claude Artifact"
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
                placeholder="A brief description of what this artifact does"
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
                {loading ? "Uploading..." : "Upload Artifact"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
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
