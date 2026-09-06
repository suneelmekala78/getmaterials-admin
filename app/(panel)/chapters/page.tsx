"use client";

import { useState, useEffect } from "react";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineX } from "react-icons/hi";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import toast from "react-hot-toast";

interface Chapter {
  _id: string;
  title: string;
  description?: string;
  order: number;
  subject?: { _id: string; name: string };
  materialsCount: number;
  createdAt: string;
}

export default function ChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editChapter, setEditChapter] = useState<Chapter | null>(null);
  const [filterSubject, setFilterSubject] = useState("");

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newOrder, setNewOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/chapters").then((r) => r.json()),
      fetch("/api/subjects").then((r) => r.json()),
    ])
      .then(([chapData, subData]) => {
        setChapters(chapData.chapters || []);
        setSubjects(subData.subjects || []);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newSubject) {
      toast.error("Title and subject are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          subject: newSubject,
          order: newOrder,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Chapter created");
        setShowCreate(false);
        setNewTitle("");
        setNewDescription("");
        setNewSubject("");
        setNewOrder(0);
        // Refresh
        const refreshed = await fetch("/api/chapters").then((r) => r.json());
        setChapters(refreshed.chapters || []);
      } else {
        toast.error(data.error || "Failed to create");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editChapter) return;
    setSaving(true);
    try {
      const res = await fetch("/api/chapters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editChapter._id,
          title: newTitle,
          description: newDescription,
          order: newOrder,
        }),
      });
      if (res.ok) {
        toast.success("Chapter updated");
        setEditChapter(null);
        const refreshed = await fetch("/api/chapters").then((r) => r.json());
        setChapters(refreshed.chapters || []);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/chapters?id=${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setChapters((prev) => prev.filter((c) => c._id !== deleteId));
        toast.success("Chapter deleted");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const openEdit = (ch: Chapter) => {
    setEditChapter(ch);
    setNewTitle(ch.title);
    setNewDescription(ch.description || "");
    setNewOrder(ch.order);
  };

  const filtered = filterSubject
    ? chapters.filter((c) => (c.subject as any)?._id === filterSubject)
    : chapters;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chapters</h1>
          <p className="text-slate-500 text-sm mt-1">{chapters.length} total chapters</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setNewTitle(""); setNewDescription(""); setNewSubject(""); setNewOrder(0); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors"
        >
          <HiOutlinePlus className="text-lg" />
          Add Chapter
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:border-violet-500"
        >
          <option value="">All Subjects</option>
          {subjects.map((s: any) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-slate-600 w-12">#</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600">Order</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600">Title</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600">Subject</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600">Materials</th>
              <th className="text-right px-6 py-3 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((ch, index) => (
              <tr key={ch._id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-xs text-slate-400 tabular-nums">{index + 1}</td>
                <td className="px-6 py-4 text-slate-600">{ch.order}</td>
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900">{ch.title}</p>
                  {ch.description && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[250px]">{ch.description}</p>}
                </td>
                <td className="px-6 py-4 text-slate-600">{(ch.subject as any)?.name || "—"}</td>
                <td className="px-6 py-4 text-slate-600">{ch.materialsCount || 0}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(ch)}
                      className="p-2 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-violet-50"
                    >
                      <HiOutlinePencil className="text-lg" />
                    </button>
                    <button
                      onClick={() => setDeleteId(ch._id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <HiOutlineTrash className="text-lg" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-sm">No chapters found.</div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg">
              <HiOutlineX className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Chapter</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject *</label>
                <select value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500">
                  <option value="">Select subject</option>
                  {subjects.map((s: any) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Chapter title" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} placeholder="Optional description" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Order</label>
                <input type="number" value={newOrder} onChange={(e) => setNewOrder(Number(e.target.value))} min={0} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500" />
                {newSubject && chapters.some((c) => (c.subject as any)?._id === newSubject && c.order === newOrder) && (
                  <p className="mt-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                    ⚠️ Another chapter in this subject already uses order {newOrder}. Chapters with the same order will appear in no guaranteed sequence.
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
                <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-50">{saving ? "Creating..." : "Create"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editChapter && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditChapter(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <button onClick={() => setEditChapter(null)} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg">
              <HiOutlineX className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Chapter</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Order</label>
                <input type="number" value={newOrder} onChange={(e) => setNewOrder(Number(e.target.value))} min={0} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500" />
                {editChapter && chapters.some((c) => c._id !== editChapter._id && (c.subject as any)?._id === (editChapter.subject as any)?._id && c.order === newOrder) && (
                  <p className="mt-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                    ⚠️ Another chapter in this subject already uses order {newOrder}. Chapters with the same order will appear in no guaranteed sequence.
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditChapter(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
                <button onClick={handleEdit} disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Chapter"
        message="Are you sure you want to delete this chapter? Materials linked to it won't be deleted."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
