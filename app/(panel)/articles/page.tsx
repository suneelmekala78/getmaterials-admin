"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Article = {
  id: string;
  title: string;
  slug: string;
  status: string;
  views: number;
  author?: { name?: string } | null;
  publishedAt?: string | null;
};

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/articles?all=1");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch {
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: "draft" | "published") => {
    const res = await fetch(`/api/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Could not update status");
      return;
    }
    toast.success(status === "published" ? "Published" : "Unpublished");
    load();
  };

  const remove = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/articles/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    if (!res.ok) {
      toast.error("Could not delete");
      return;
    }
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Articles</h1>
        <p className="text-sm text-gray-500 mt-1">
          Moderate teacher-published educational articles.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-gray-500">No articles yet.</p>
      ) : (
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Author</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Views</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-gray-400">/{a.slug}</p>
                  </td>
                  <td className="px-4 py-3">{a.author?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        a.status === "published"
                          ? "text-emerald-600 font-medium"
                          : "text-amber-600 font-medium"
                      }
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{a.views || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {a.status === "published" ? (
                        <button
                          type="button"
                          onClick={() => setStatus(a.id, "draft")}
                          className="text-xs font-semibold text-amber-700 hover:underline"
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setStatus(a.id, "published")}
                          className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          Publish
                        </button>
                      )}
                      <Link
                        href={`/articles/${a.id}/edit`}
                        className="text-xs font-semibold text-violet-700 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteId(a.id)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete article?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
