"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { TagTree } from "@/components/TagTree";
import { TagForm } from "@/components/TagForm";
import type { Tag } from "@/lib/tags";

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) {
        setTags(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  function handleEdit(tag: Tag) {
    setEditingTag(tag);
    setShowForm(true);
  }

  async function handleDelete(tag: Tag) {
    if (!confirm(`Delete tag "${tag.name}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/tags/${tag.id}`, { method: "DELETE" });
    if (res.ok) {
      fetchTags();
    }
  }

  async function handleSave(data: {
    name: string;
    color: string | null;
    parent_id: number | null;
  }) {
    const url = editingTag ? `/api/tags/${editingTag.id}` : "/api/tags";
    const method = editingTag ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save");
    }

    await fetchTags();
  }

  function openCreate() {
    setEditingTag(null);
    setShowForm(true);
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Tags</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Organize your artifacts with hierarchical tags
              </p>
            </div>
            <button
              onClick={openCreate}
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
              Create Tag
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-4">
              <TagTree
                tags={tags}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}
        </motion.div>
      </main>

      <TagForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        tag={editingTag}
        allTags={tags}
      />
    </div>
  );
}
