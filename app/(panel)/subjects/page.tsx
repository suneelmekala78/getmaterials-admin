"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, Edit, Trash2, X, Save, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import toast from "react-hot-toast";

interface SubjectItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  isActive: boolean;
  materialsCount: number;
}

const categories = [
  "science",
  "arts",
  "engineering",
  "commerce",
  "medical",
  "law",
  "general",
];

export default function SubjectsAdminPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", description: "", category: "general", isActive: true });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [newData, setNewData] = useState({ name: "", description: "", category: "general" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/subjects");
      const data = await res.json();
      setSubjects(data.subjects || []);
    } catch {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (subject: SubjectItem) => {
    setEditId(subject._id);
    setEditData({
      name: subject.name,
      description: subject.description || "",
      category: subject.category,
      isActive: subject.isActive,
    });
  };

  const handleSave = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/subjects/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (res.ok) {
        setSubjects((prev) =>
          prev.map((s) => (s._id === editId ? { ...s, ...data.subject } : s))
        );
        setEditId(null);
        toast.success("Subject updated");
      } else {
        toast.error(data.error || "Failed to update subject");
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
      const res = await fetch(`/api/subjects/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setSubjects((prev) => prev.filter((s) => s._id !== deleteId));
        toast.success("Subject deleted");
      } else {
        toast.error(data.error || "Failed to delete subject");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });
      const data = await res.json();
      if (res.ok) {
        setSubjects((prev) => [...prev, data.subject]);
        setShowNew(false);
        setNewData({ name: "", description: "", category: "general" });
        toast.success("Subject created");
      } else {
        toast.error(data.error || "Failed to create subject");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subjects</h1>
          <p className="text-slate-500 mt-1">
            Manage subjects and their categories
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold rounded-xl text-sm hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add Subject</h2>
              <button onClick={() => setShowNew(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newData.name}
                  onChange={(e) => setNewData({ ...newData, name: e.target.value })}
                  required
                  placeholder="e.g., Data Structures"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={newData.description}
                  onChange={(e) => setNewData({ ...newData, description: e.target.value })}
                  rows={2}
                  placeholder="Brief description..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select
                  value={newData.category}
                  onChange={(e) => setNewData({ ...newData, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors">
                  {creating ? "Creating..." : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3 font-medium text-slate-500">Subject</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Category</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Materials</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Status</th>
                <th className="text-right px-6 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {subjects.map((subject) => (
                <tr key={subject._id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    {editId === subject._id ? (
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full px-3 py-1.5 border border-violet-300 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{subject.name}</p>
                          <p className="text-xs text-slate-400">{subject.slug}</p>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editId === subject._id ? (
                      <select
                        value={editData.category}
                        onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                        className="px-3 py-1.5 border border-violet-300 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="capitalize text-slate-600">{subject.category}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {subject.materialsCount || 0}
                  </td>
                  <td className="px-6 py-4">
                    {editId === subject._id ? (
                      <button
                        type="button"
                        onClick={() => setEditData({ ...editData, isActive: !editData.isActive })}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          editData.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {editData.isActive ? "Active" : "Inactive"}
                      </button>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        subject.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {subject.isActive ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {editId === subject._id ? (
                        <>
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(subject)}
                            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(subject._id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {subjects.length === 0 && (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No subjects yet. Add your first subject.</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Subject"
        message="Are you sure? This will permanently delete this subject. Subjects with materials cannot be deleted."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
