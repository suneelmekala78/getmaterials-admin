"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HiOutlinePencil, HiOutlinePlus, HiOutlineSearch, HiOutlineTrash } from "react-icons/hi";
import toast from "react-hot-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Problem = {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  tags: string[];
  isActive: boolean;
  sampleCount: number;
  hiddenCount: number;
};

type Discussion = {
  id: string;
  body: string;
  authorName: string;
  problemTitle: string;
  problemSlug: string;
};

const difficultyClass: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-800",
  hard: "bg-rose-50 text-rose-700",
};

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [problemRes, discussionRes] = await Promise.all([
        fetch("/api/practice/admin/problems"),
        fetch("/api/practice/admin/discussions"),
      ]);
      const problemData = await problemRes.json();
      const discussionData = await discussionRes.json();
      if (!problemRes.ok) throw new Error(problemData.error || "Failed to load problems");
      setProblems(problemData.problems || []);
      setDiscussions(discussionData.discussions || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load problems");
      toast.error("Failed to load problems");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return problems.filter((problem) => {
      if (difficulty && problem.difficulty !== difficulty) return false;
      if (!q) return true;
      return problem.title.toLowerCase().includes(q) || problem.tags.some((tag) => tag.toLowerCase().includes(q));
    });
  }, [problems, query, difficulty]);

  const counts = {
    easy: problems.filter((problem) => problem.difficulty === "easy").length,
    medium: problems.filter((problem) => problem.difficulty === "medium").length,
    hard: problems.filter((problem) => problem.difficulty === "hard").length,
    hidden: problems.filter((problem) => !problem.isActive).length,
  };

  const remove = async () => {
    if (!deleteId || busy) return;
    setBusy(true);
    const res = await fetch(`/api/practice/problems/${deleteId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) toast.error("Could not delete");
    else toast.success("Problem deleted");
    setDeleteId(null);
    load();
  };

  const removeDiscussion = async () => {
    if (!deletePostId || busy) return;
    setBusy(true);
    const res = await fetch(`/api/practice/discussions/${deletePostId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      toast.error("Could not delete comment");
      return;
    }
    setDiscussions((prev) => prev.filter((post) => post.id !== deletePostId));
    setDeletePostId(null);
    toast.success("Comment deleted");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Problems</h1>
          <p className="text-slate-500 text-sm mt-1">{problems.length} coding problems · {counts.hidden} hidden from students</p>
        </div>
        <Link href="/problems/create" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700">
          <HiOutlinePlus className="text-lg" />
          New problem
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Easy" value={counts.easy} tone="text-emerald-700 bg-emerald-50" />
        <Stat label="Medium" value={counts.medium} tone="text-amber-800 bg-amber-50" />
        <Stat label="Hard" value={counts.hard} tone="text-rose-700 bg-rose-50" />
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or tag"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-violet-300"
          />
        </div>
        <div className="flex gap-2">
          {[
            ["", "All"],
            ["easy", "Easy"],
            ["medium", "Medium"],
            ["hard", "Hard"],
          ].map(([id, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setDifficulty(id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold ${difficulty === id ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <p className="font-semibold text-slate-800">No problems match</p>
          <p className="text-sm text-slate-500 mt-1">Clear the search or create a new problem.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Problem</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Difficulty</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Tests</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((problem) => (
                <tr key={problem.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{problem.title}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">/practice/{problem.slug}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {problem.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${difficultyClass[problem.difficulty] || "bg-slate-100 text-slate-600"}`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{problem.sampleCount} sample · {problem.hiddenCount} hidden</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${problem.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {problem.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/problems/${problem.id}/edit`} className="p-2 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-violet-50" aria-label="Edit">
                        <HiOutlinePencil className="text-lg" />
                      </Link>
                      <button type="button" className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50" aria-label="Delete" onClick={() => setDeleteId(problem.id)}>
                        <HiOutlineTrash className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Recent discussions</h2>
          <p className="text-sm text-slate-500">Comments students posted on problems.</p>
        </div>
        {discussions.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-sm text-slate-500">No comments yet.</div>
        ) : (
          <div className="grid gap-3">
            {discussions.map((post) => (
              <article key={post.id} className="bg-white border border-slate-100 rounded-2xl px-4 py-3 flex items-start gap-3">
                <span className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 text-sm font-bold inline-flex items-center justify-center shrink-0">
                  {(post.authorName || "S").slice(0, 1).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{post.authorName}</p>
                  <p className="text-xs text-slate-400">{post.problemTitle}</p>
                  <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{post.body}</p>
                </div>
                <button type="button" className="text-sm font-semibold text-rose-600 shrink-0" onClick={() => setDeletePostId(post.id)}>Delete</button>
              </article>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete this problem?"
        message="Submissions and comments for this problem will also be removed."
        confirmLabel={busy ? "Deleting…" : "Delete"}
        onConfirm={remove}
        onCancel={() => { if (!busy) setDeleteId(null); }}
      />
      <ConfirmDialog
        open={Boolean(deletePostId)}
        title="Delete this comment?"
        message="The comment will be removed from the problem discussion."
        confirmLabel={busy ? "Deleting…" : "Delete"}
        onConfirm={removeDiscussion}
        onCancel={() => { if (!busy) setDeletePostId(null); }}
      />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-2xl px-4 py-3 ${tone}`}>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}
