"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, X } from "lucide-react";
import toast from "react-hot-toast";

type College = { _id?: string; id?: string; name: string; code: string };

function collegeId(college: College) {
  return String(college.id || college._id);
}

export function AssignCollegesModal({
  open,
  title,
  initialIds,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  title: string;
  initialIds: string[];
  onClose: () => void;
  onSave: (collegeIds: string[]) => Promise<void> | void;
  saving?: boolean;
}) {
  const [colleges, setColleges] = useState<College[]>([]);
  const [selected, setSelected] = useState<string[]>(initialIds);
  const [query, setQuery] = useState("");
  const initialKey = initialIds.join(",");

  useEffect(() => {
    if (!open) return;
    setSelected(initialKey ? initialKey.split(",") : []);
    setQuery("");
    fetch("/api/colleges")
      .then((res) => res.json())
      .then((data) => setColleges(data.colleges || []))
      .catch(() => toast.error("Failed to load colleges"));
  }, [open, initialKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return colleges;
    return colleges.filter(
      (college) =>
        college.name.toLowerCase().includes(q) || college.code.toLowerCase().includes(q)
    );
  }, [colleges, query]);

  if (!open) return null;

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Assign colleges</h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{title}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search colleges..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="px-5 pb-3 overflow-y-auto flex-1 space-y-1">
          {filtered.map((college) => {
            const id = collegeId(college);
            const checked = selected.includes(id);
            return (
              <label
                key={id}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer ${
                  checked ? "bg-violet-50" : "hover:bg-slate-50"
                }`}
              >
                <input type="checkbox" checked={checked} onChange={() => toggle(id)} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-900 truncate">{college.name}</span>
                  <span className="text-[11px] text-slate-400">{college.code}</span>
                </span>
              </label>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-slate-400 py-6 text-center">No colleges found.</p>
          )}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">{selected.length} selected</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => onSave(selected)}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function collegeLabels(material: any) {
  const items = [
    ...(material.colleges || []),
    ...(material.college && !Array.isArray(material.college) ? [material.college] : []),
  ].filter((item) => item && (item.name || item.code));
  const unique = new Map<string, string>();
  items.forEach((item: any) => {
    unique.set(String(item._id || item.id || item.name), item.name || item.code);
  });
  return Array.from(unique.values());
}

export function AssignCollegesIconButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
      title="Assign colleges"
    >
      <Building2 className="w-4 h-4" />
    </button>
  );
}
