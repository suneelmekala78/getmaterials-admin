"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HiOutlinePencil, HiOutlinePlus, HiOutlineSearch, HiOutlineTrash } from "react-icons/hi";
import toast from "react-hot-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Contest = {
  id: string;
  title: string;
  slug: string;
  phase: string;
  isPublished: boolean;
  startAt: string;
  endAt: string;
  problems: { title: string }[];
};

const phaseClass: Record<string, string> = {
  live: "bg-emerald-50 text-emerald-700",
  upcoming: "bg-violet-50 text-violet-700",
  ended: "bg-slate-100 text-slate-600",
};

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/practice/admin/contests");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load contests");
      setContests(data.contests || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contests");
      toast.error("Failed to load contests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contests.filter((contest) => {
      if (phase && contest.phase !== phase) return false;
      if (!q) return true;
      return contest.title.toLowerCase().includes(q);
    });
  }, [contests, query, phase]);

  const counts = {
    live: contests.filter((contest) => contest.phase === "live").length,
    upcoming: contests.filter((contest) => contest.phase === "upcoming").length,
    draft: contests.filter((contest) => !contest.isPublished).length,
  };

  const remove = async () => {
    if (!deleteId || busy) return;
    setBusy(true);
    const res = await fetch(`/api/practice/contests/${deleteId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) toast.error("Could not delete");
    else toast.success("Contest deleted");
    setDeleteId(null);
    load();
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
          <h1 className="text-2xl font-bold text-slate-900">Contests</h1>
          <p className="text-slate-500 text-sm mt-1">{contests.length} scheduled · {counts.draft} unpublished</p>
        </div>
        <Link href="/contests/create" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700">
          <HiOutlinePlus className="text-lg" />
          New contest
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Live" value={counts.live} tone="text-emerald-700 bg-emerald-50" />
        <Stat label="Upcoming" value={counts.upcoming} tone="text-violet-700 bg-violet-50" />
        <Stat label="Drafts" value={counts.draft} tone="text-slate-700 bg-slate-100" />
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contests"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-violet-300"
          />
        </div>
        <div className="flex gap-2">
          {[
            ["", "All"],
            ["live", "Live"],
            ["upcoming", "Upcoming"],
            ["ended", "Ended"],
          ].map(([id, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setPhase(id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold ${phase === id ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <p className="font-semibold text-slate-800">No contests match</p>
          <p className="text-sm text-slate-500 mt-1">Schedule one when you want a timed set of problems.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((contest) => (
            <article key={contest.id} className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-slate-900">{contest.title}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${phaseClass[contest.phase] || phaseClass.ended}`}>{contest.phase}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${contest.isPublished ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {contest.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {new Date(contest.startAt).toLocaleString()} – {new Date(contest.endAt).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">{contest.problems.length} problems</p>
              </div>
              <div className="flex items-center gap-1">
                <Link href={`/contests/${contest.id}/edit`} className="p-2 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-violet-50" aria-label="Edit">
                  <HiOutlinePencil className="text-lg" />
                </Link>
                <button type="button" className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50" aria-label="Delete" onClick={() => setDeleteId(contest.id)}>
                  <HiOutlineTrash className="text-lg" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete this contest?"
        message="The problems stay. Only the contest schedule is removed."
        confirmLabel={busy ? "Deleting…" : "Delete"}
        onConfirm={remove}
        onCancel={() => { if (!busy) setDeleteId(null); }}
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
