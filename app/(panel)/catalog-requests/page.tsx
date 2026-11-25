"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  HiOutlineClipboardList,
  HiOutlinePencil,
  HiOutlineSearch,
  HiOutlineTrash,
} from "react-icons/hi";
import { UserAvatar } from "@/components/UserAvatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Person = {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
};

type RequestRow = {
  _id: string;
  kind: string;
  name: string;
  status: "pending" | "added" | "dismissed";
  context?: string;
  responseNote?: string;
  createdAt: string;
  updatedAt?: string;
  respondedAt?: string | null;
  user?: Person;
  college?: { name?: string; code?: string };
  respondedBy?: Person | null;
};

const KIND_LABEL: Record<string, string> = {
  college: "College",
  program: "Course",
  branch: "Branch",
  year: "Year",
  semester: "Semester",
  section: "Section",
  subject: "Subject",
};

const KIND_OPTIONS = Object.keys(KIND_LABEL);

const STATUS_STYLE: Record<RequestRow["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  added: "bg-emerald-50/80 text-emerald-700",
  dismissed: "bg-slate-100/80 text-slate-600",
};

function when(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CatalogRequestsPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | RequestRow["status"]>("all");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<RequestRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", kind: "subject", context: "", responseNote: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    fetch("/api/admin/catalog-requests")
      .then((res) => res.json())
      .then((data) => {
        const requests: RequestRow[] = data.requests || [];
        setRows(requests);
        setNotes((prev) => {
          const next = { ...prev };
          for (const row of requests) {
            if (next[row._id] === undefined) next[row._id] = row.responseNote || "";
          }
          return next;
        });
      })
      .catch(() => toast.error("Could not load suggestions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (row: RequestRow) => {
    setEditing(row);
    setEditForm({
      name: row.name || "",
      kind: row.kind || "subject",
      context: row.context || "",
      responseNote: notes[row._id] ?? row.responseNote ?? "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusyId(editing._id);
    try {
      const res = await fetch("/api/admin/catalog-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing._id,
          action: "edit",
          name: editForm.name,
          kind: editForm.kind,
          context: editForm.context,
          responseNote: editForm.responseNote,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Update failed");
      if (data.request) {
        setRows((prev) => prev.map((row) => (row._id === editing._id ? data.request : row)));
        setNotes((prev) => ({ ...prev, [editing._id]: data.request.responseNote || "" }));
      }
      toast.success("Suggestion updated");
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update");
    } finally {
      setBusyId(null);
    }
  };

  const update = async (id: string, status: RequestRow["status"]) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/catalog-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status,
          responseNote: status === "pending" ? "" : notes[id] || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Update failed");
      if (data.request) {
        setRows((prev) => prev.map((row) => (row._id === id ? data.request : row)));
        setNotes((prev) => ({ ...prev, [id]: data.request.responseNote || "" }));
      }
      toast.success(
        status === "pending"
          ? "Reopened"
          : status === "added"
            ? "Marked as added — student notified"
            : "Dismissed — student notified",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/catalog-requests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setRows((prev) => prev.filter((row) => row._id !== deleteId));
      toast.success("Suggestion deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const counts = useMemo(() => {
    return {
      all: rows.length,
      pending: rows.filter((row) => row.status === "pending").length,
      added: rows.filter((row) => row.status === "added").length,
      dismissed: rows.filter((row) => row.status === "dismissed").length,
    };
  }, [rows]);

  const visible = rows.filter((row) => {
    if (filter !== "all" && row.status !== filter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [row.name, row.kind, row.context, row.user?.name, row.user?.email, row.college?.name, row.college?.code]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campus suggestions</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Students asked for a college, course, branch, or subject that is not in the catalog yet. Add it from Colleges or Subjects, then record your response. Notes go to the student by email and app notification.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200">
          <HiOutlineClipboardList className="w-4 h-4 text-violet-500" />
          <span className="font-medium">{counts.pending} waiting</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          [
            ["all", "All"],
            ["pending", "Pending"],
            ["added", "Added"],
            ["dismissed", "Dismissed"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              filter === key
                ? "border-violet-300 bg-violet-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{counts[key]}</p>
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search suggestion, student, or college..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <HiOutlineClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No suggestions match this view.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((row) => {
            const resolved = row.status !== "pending";
            const respondedAt = row.respondedAt || (resolved ? row.updatedAt : "");
            const collegeLabel = [row.college?.name, row.college?.code].filter(Boolean).join(" · ");
            return (
              <article
                key={row._id}
                className={`rounded-2xl border p-5 transition ${
                  resolved
                    ? "border-slate-100/80 bg-slate-50/70 opacity-70 hover:opacity-90 shadow-none"
                    : "border-slate-100 bg-white shadow-sm"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                        {KIND_LABEL[row.kind] || row.kind}
                      </span>
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[row.status]}`}>
                        {row.status}
                      </span>
                      {resolved ? (
                        <span className="rounded-lg bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200/80">
                          Resolved
                        </span>
                      ) : null}
                    </div>
                    <h2 className={`mt-2 text-lg font-semibold ${resolved ? "text-slate-600" : "text-slate-900"}`}>
                      {row.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {collegeLabel || row.context || "No college attached"}
                      {row.context && collegeLabel ? ` · ${row.context}` : ""}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-right text-xs text-slate-500">
                      <p className="font-semibold uppercase tracking-wide text-slate-400">Requested</p>
                      <p className="mt-1 text-sm text-slate-700">{when(row.createdAt) || "—"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-violet-600"
                      title="Edit suggestion"
                    >
                      <HiOutlinePencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(row._id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete suggestion"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className={`mt-4 grid gap-4 rounded-xl p-4 sm:grid-cols-2 ${resolved ? "bg-white/50" : "bg-slate-50"}`}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Student</p>
                    <div className="mt-2 flex items-center gap-3">
                      <UserAvatar name={row.user?.name} image={row.user?.avatar} role={row.user?.role} size={40} />
                      <div className="min-w-0">
                        {row.user?._id ? (
                          <Link href={`/users/${row.user._id}`} className="block truncate text-sm font-medium text-slate-900 hover:text-violet-700">
                            {row.user.name || "Student"}
                          </Link>
                        ) : (
                          <p className="truncate text-sm font-medium text-slate-900">{row.user?.name || "Student"}</p>
                        )}
                        <p className="truncate text-xs text-slate-500">
                          {[row.user?.email, row.user?.role?.replace("_", " ")].filter(Boolean).join(" · ") || "No profile"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Admin response</p>
                    {row.status === "pending" && !respondedAt ? (
                      <p className="mt-2 text-sm text-slate-500">Waiting for a response.</p>
                    ) : (
                      <div className="mt-2">
                        <p className="text-sm text-slate-700">{when(respondedAt) || "Time not recorded"}</p>
                        {row.respondedBy ? (
                          <div className="mt-2 flex items-center gap-2">
                            <UserAvatar
                              name={row.respondedBy.name}
                              image={row.respondedBy.avatar}
                              role={row.respondedBy.role}
                              size={28}
                            />
                            <p className="text-xs text-slate-600 truncate">
                              {row.respondedBy.name || row.respondedBy.email || "Admin"}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-slate-400">Responder was not stored on older suggestions.</p>
                        )}
                        {row.responseNote ? (
                          <p className="mt-2 text-sm text-slate-600">{row.responseNote}</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                <div className={`mt-4 flex flex-col gap-3 sm:flex-row sm:items-center ${resolved ? "opacity-90" : ""}`}>
                  <input
                    value={notes[row._id] ?? ""}
                    onChange={(event) =>
                      setNotes((prev) => ({ ...prev, [row._id]: event.target.value.slice(0, 500) }))
                    }
                    placeholder="Optional note for this response (emailed + push notified)"
                    className="flex-1 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === row._id}
                      onClick={() => update(row._id, "added")}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {busyId === row._id ? "Saving..." : row.status === "added" ? "Save note" : "Mark added"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row._id}
                      onClick={() => update(row._id, "dismissed")}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"
                    >
                      {row.status === "dismissed" ? "Save note" : "Dismiss"}
                    </button>
                    {row.status !== "pending" ? (
                      <button
                        type="button"
                        disabled={busyId === row._id}
                        onClick={() => update(row._id, "pending")}
                        className="rounded-xl px-3 py-2 text-xs font-semibold text-violet-700 disabled:opacity-50"
                      >
                        Reopen
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Edit suggestion</h3>
            <p className="mt-1 text-sm text-slate-500">Update the request details. Status stays the same unless you use the card actions.</p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Name</span>
                <input
                  value={editForm.name}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value.slice(0, 200) }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Type</span>
                <select
                  value={editForm.kind}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, kind: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                >
                  {KIND_OPTIONS.map((kind) => (
                    <option key={kind} value={kind}>
                      {KIND_LABEL[kind]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Context</span>
                <input
                  value={editForm.context}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, context: event.target.value.slice(0, 300) }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Response note</span>
                <textarea
                  value={editForm.responseNote}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, responseNote: event.target.value.slice(0, 500) }))
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === editing._id || !editForm.name.trim()}
                onClick={saveEdit}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busyId === editing._id ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete suggestion"
        message="Delete this campus suggestion permanently? This cannot be undone."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
