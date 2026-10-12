"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

type ProblemOption = { id: string; title: string; slug: string };
type Selected = { problem: string; points: number };

function toLocalInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ContestForm({ contestId }: { contestId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(contestId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [options, setOptions] = useState<ProblemOption[]>([]);
  const [selected, setSelected] = useState<Selected[]>([]);
  const [problemQuery, setProblemQuery] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/practice/admin/problems").then((res) => res.json()),
      contestId ? fetch(`/api/practice/admin/contests/${contestId}`).then((res) => res.json()) : Promise.resolve(null),
    ])
      .then(([problemData, contestData]) => {
        setOptions(problemData.problems || []);
        const contest = contestData?.contest;
        if (contest) {
          setTitle(contest.title || "");
          setStartAt(toLocalInput(contest.startAt));
          setEndAt(toLocalInput(contest.endAt));
          setIsPublished(Boolean(contest.isPublished));
          setSelected(
            (contest.problems || []).map((item: { problem: string; points: number }) => ({
              problem: item.problem,
              points: item.points || 1,
            })),
          );
        }
      })
      .catch(() => toast.error("Failed to load contest"))
      .finally(() => setLoading(false));
  }, [contestId]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.some((item) => item.problem === id)
        ? prev.filter((item) => item.problem !== id)
        : [...prev, { problem: id, points: 1 }],
    );
  };

  const save = async () => {
    if (!selected.length) {
      toast.error("Pick at least one problem");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        isPublished,
        problems: selected,
      };
      const res = await fetch(isEdit ? `/api/practice/contests/${contestId}` : "/api/practice/contests", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save");
        return;
      }
      toast.success(isEdit ? "Contest updated" : "Contest created");
      router.push("/contests");
    } catch {
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const visible = options.filter((problem) => problem.title.toLowerCase().includes(problemQuery.trim().toLowerCase()));
  const canSave = title.trim() && startAt && endAt && selected.length > 0 && !saving;

  return (
    <div className="max-w-3xl space-y-5">
      <Link href="/contests" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-violet-700">
        <ArrowLeft size={16} /> Contests
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{isEdit ? "Edit contest" : "New contest"}</h1>
        <p className="text-sm text-slate-500 mt-1">Students see a published contest only between the start and end times. Ranking uses solves, then time plus a 5-minute penalty for each wrong submit.</p>
      </div>

      <section className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
        <label className="block text-sm font-semibold text-slate-800">
          Title
          <input className={fieldClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sunday sprint" />
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm font-semibold text-slate-800">
            Starts
            <input type="datetime-local" className={fieldClass} value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-800">
            Ends
            <input type="datetime-local" className={fieldClass} value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </label>
        </div>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
          Published
          <input type="checkbox" className="h-4 w-4 accent-violet-600" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        </label>
      </section>

      <section className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900">Problems</h2>
            <p className="text-xs text-slate-500">{selected.length} selected</p>
          </div>
          <input
            value={problemQuery}
            onChange={(e) => setProblemQuery(e.target.value)}
            placeholder="Search problems"
            className="w-48 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-300"
          />
        </div>
        <div className="max-h-96 overflow-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
          {visible.map((problem) => {
            const row = selected.find((item) => item.problem === problem.id);
            return (
            <div key={problem.id} className={`flex items-center gap-3 px-3 py-3 ${row ? "bg-violet-50/60" : "hover:bg-slate-50"}`}>
              <input id={`problem-${problem.id}`} type="checkbox" className="h-4 w-4 accent-violet-600" checked={Boolean(row)} onChange={() => toggle(problem.id)} />
              <label htmlFor={`problem-${problem.id}`} className="flex-1 text-sm font-semibold text-slate-900 cursor-pointer">{problem.title}</label>
                {row ? (
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    Points
                    <input
                      type="number"
                      min={1}
                      className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900"
                      value={row.points}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        setSelected((prev) =>
                          prev.map((item) =>
                            item.problem === problem.id ? { ...item, points: Number(e.target.value) || 1 } : item,
                          ),
                        )
                      }
                    />
                  </span>
                ) : null}
              </div>
            );
          })}
          {visible.length === 0 ? <p className="p-4 text-sm text-slate-500">No problems match.</p> : null}
        </div>
      </section>

      <button type="button" disabled={!canSave} onClick={save} className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold disabled:opacity-50">
        {saving ? "Saving…" : "Save contest"}
      </button>
    </div>
  );
}

const fieldClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-violet-300 focus:bg-white";
