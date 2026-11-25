"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminEditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/articles/${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => {
        const a = data.article;
        if (!a) throw new Error("missing");
        setTitle(a.title || "");
        setExcerpt(a.excerpt || "");
        setBodyHtml(a.bodyHtml || "");
        setCoverUrl(a.coverUrl || "");
        setTags((a.tags || []).join(", "));
        setStatus(a.status === "published" ? "published" : "draft");
      })
      .catch(() => toast.error("Article not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt,
          bodyHtml,
          coverUrl,
          tags,
          status,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Could not save");
        return;
      }
      toast.success("Saved");
      router.push("/articles");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading…</p>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/articles" className="text-sm text-violet-700 hover:underline">
          ← Articles
        </Link>
        <h1 className="text-2xl font-bold mt-1">Edit article</h1>
      </div>
      <form onSubmit={save} className="bg-white border border-black/10 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-sm font-medium">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Cover URL</label>
          <input
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Tags</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Body (HTML)</label>
          <textarea
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            rows={14}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-mono"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
