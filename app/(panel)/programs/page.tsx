"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Plus, Trash2, Save, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Program = {
  key: string;
  label: string;
  durationYears: number;
  totalSemesters: number;
};

const EMPTY: Program = {
  key: "",
  label: "",
  durationYears: 4,
  totalSemesters: 8,
};

function slugKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminDefaultProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Program>(EMPTY);
  const [removeKey, setRemoveKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/programs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setPrograms(data.programs || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load programs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addDraft = () => {
    const label = draft.label.trim();
    const key = slugKey(draft.key || label);
    if (!label) {
      toast.error("Enter a program label (e.g. B.Tech)");
      return;
    }
    if (!key) {
      toast.error("Program key must use letters or numbers");
      return;
    }
    if (programs.some((p) => p.key === key)) {
      toast.error(`Program "${key}" already exists`);
      return;
    }
    setPrograms((prev) => [
      ...prev,
      {
        key,
        label,
        durationYears: Number(draft.durationYears) || 4,
        totalSemesters: Number(draft.totalSemesters) || 8,
      },
    ]);
    setDraft(EMPTY);
  };

  const updateRow = (key: string, patch: Partial<Program>) => {
    setPrograms((prev) =>
      prev.map((p) => (p.key === key ? { ...p, ...patch } : p)),
    );
  };

  const confirmRemove = () => {
    if (!removeKey) return;
    setPrograms((prev) => prev.filter((p) => p.key !== removeKey));
    setRemoveKey(null);
  };

  const save = async () => {
    if (!programs.length) {
      toast.error("Keep at least one default program");
      return;
    }
    for (const p of programs) {
      if (!p.label.trim() || !slugKey(p.key)) {
        toast.error("Every program needs a label and key");
        return;
      }
    }
    setSaving(true);
    try {
      const payload = programs.map((p) => ({
        key: slugKey(p.key),
        label: p.label.trim(),
        durationYears: Number(p.durationYears) || 4,
        totalSemesters: Number(p.totalSemesters) || 8,
      }));
      const res = await fetch("/api/programs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programs: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setPrograms(data.programs || payload);
      toast.success("Default programs saved");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Default Programs</h1>
          <p className="text-slate-500 mt-1">
            Platform-wide program options used in upload, filters, and onboarding when a college
            has no programs of its own. College-specific programs still come from{" "}
            <a href="/colleges" className="text-violet-600 font-medium hover:underline">
              Colleges → Add Program
            </a>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reload
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-violet-500" />
          <h2 className="font-semibold text-slate-900">Programs ({programs.length})</h2>
        </div>

        <div className="divide-y divide-slate-50">
          {programs.map((p) => (
            <div
              key={p.key}
              className="px-6 py-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
            >
              <div className="sm:col-span-4">
                <label className="text-[11px] text-slate-400 font-medium">Label</label>
                <input
                  type="text"
                  value={p.label}
                  onChange={(e) => updateRow(p.key, { label: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="text-[11px] text-slate-400 font-medium">Key</label>
                <input
                  type="text"
                  value={p.key}
                  onChange={(e) => updateRow(p.key, { key: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-400 font-medium">Years</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={p.durationYears}
                  onChange={(e) =>
                    updateRow(p.key, { durationYears: parseInt(e.target.value) || 4 })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-400 font-medium">Semesters</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={p.totalSemesters}
                  onChange={(e) =>
                    updateRow(p.key, { totalSemesters: parseInt(e.target.value) || 8 })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="sm:col-span-1 flex sm:justify-end pt-5">
                <button
                  type="button"
                  onClick={() => setRemoveKey(p.key)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/60 space-y-3">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-violet-500" /> Add program
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <input
              type="text"
              value={draft.label}
              onChange={(e) => {
                const label = e.target.value;
                setDraft((prev) => ({
                  ...prev,
                  label,
                  key:
                    !prev.key || prev.key === slugKey(prev.label)
                      ? slugKey(label)
                      : prev.key,
                }));
              }}
              placeholder="Label (e.g. B.Tech)"
              className="sm:col-span-4 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500"
            />
            <input
              type="text"
              value={draft.key}
              onChange={(e) => setDraft({ ...draft, key: e.target.value })}
              placeholder="Key (e.g. btech)"
              className="sm:col-span-3 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono bg-white focus:outline-none focus:border-violet-500"
            />
            <input
              type="number"
              min={1}
              max={10}
              value={draft.durationYears}
              onChange={(e) =>
                setDraft({ ...draft, durationYears: parseInt(e.target.value) || 4 })
              }
              placeholder="Years"
              className="sm:col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500"
            />
            <input
              type="number"
              min={1}
              max={20}
              value={draft.totalSemesters}
              onChange={(e) =>
                setDraft({ ...draft, totalSemesters: parseInt(e.target.value) || 8 })
              }
              placeholder="Semesters"
              className="sm:col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500"
            />
            <button
              type="button"
              onClick={addDraft}
              className="sm:col-span-1 px-3 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700"
            >
              Add
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Click Save after adding or editing so website, app, and study onboarding pick up the new list.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(removeKey)}
        title="Remove program?"
        message={`Remove "${removeKey}" from the default list? Existing materials that already use this key are not deleted.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={confirmRemove}
        onCancel={() => setRemoveKey(null)}
      />
    </div>
  );
}
