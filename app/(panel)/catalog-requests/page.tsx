"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type RequestRow = {
  _id: string;
  kind: string;
  name: string;
  status: "pending" | "added" | "dismissed";
  context?: string;
  createdAt: string;
  user?: { name?: string; email?: string };
  college?: { name?: string };
};

export default function CatalogRequestsPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/catalog-requests")
      .then((res) => res.json())
      .then((data) => setRows(data.requests || []))
      .catch(() => toast.error("Could not load suggestions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (id: string, status: RequestRow["status"]) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/catalog-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Update failed");
      setRows((prev) => prev.map((row) => (row._id === id ? { ...row, status } : row)));
    } catch {
      toast.error("Could not update");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Campus suggestions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Students typed a college, course, branch, or subject that is not in the catalog yet. Add it from Colleges or Subjects, then mark it added.
        </p>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">No suggestions yet.</p>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400">
                <th className="px-4 py-3">Suggestion</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 capitalize">{row.kind}: {row.name}</p>
                    <p className="text-xs text-slate-500">{row.college?.name || row.context || "No college yet"}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.user?.name || row.user?.email || "Student"}</td>
                  <td className="px-4 py-3 capitalize">{row.status}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      disabled={busyId === row._id}
                      onClick={() => update(row._id, "added")}
                      className="text-xs font-semibold text-emerald-700 disabled:opacity-50"
                    >
                      {busyId === row._id ? "Saving..." : "Added"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row._id}
                      onClick={() => update(row._id, "dismissed")}
                      className="text-xs font-semibold text-slate-500 disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
