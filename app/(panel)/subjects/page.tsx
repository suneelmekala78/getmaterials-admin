"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, Edit, Trash2, X, Loader2, ImagePlus, Search } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { uploadBrowserFile } from "@/lib/upload-file";
import toast from "react-hot-toast";

interface SubjectItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  isActive: boolean;
  materialsCount: number;
  icon?: string;
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

const DEFAULT_ICON = "/images/default-subject.png";
const DESCRIPTION_LIMIT = 300;

const emptyForm = { name: "", description: "", category: "general", isActive: true };

type DialogState = { kind: "new" } | { kind: "edit"; subject: SubjectItem } | null;

function label(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function SubjectsAdminPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [form, setForm] = useState(emptyForm);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState("");
  const [clearIcon, setClearIcon] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => setSubjects(data.subjects || []))
      .catch(() => toast.error("Failed to load subjects"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setDialog(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, saving]);

  const openNew = () => {
    setForm(emptyForm);
    setIconFile(null);
    setIconPreview("");
    setClearIcon(false);
    setDialog({ kind: "new" });
  };

  const openEdit = (subject: SubjectItem) => {
    setForm({
      name: subject.name,
      description: subject.description || "",
      category: subject.category || "general",
      isActive: subject.isActive,
    });
    setIconFile(null);
    setIconPreview(subject.icon || "");
    setClearIcon(false);
    setDialog({ kind: "edit", subject });
  };

  const closeDialog = () => {
    if (!saving) setDialog(null);
  };

  const pickIcon = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
    setClearIcon(false);
  };

  const removeIcon = () => {
    setIconFile(null);
    setIconPreview("");
    setClearIcon(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dialog || !form.name.trim()) return;
    setSaving(true);
    try {
      let iconUrl: string | undefined;
      if (iconFile) {
        const uploaded = await uploadBrowserFile(iconFile, "subject-icons");
        iconUrl = uploaded.fileUrl;
      }

      const isEdit = dialog.kind === "edit";
      const res = await fetch(isEdit ? `/api/subjects/${dialog.subject._id}` : "/api/subjects", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category,
          ...(isEdit ? { isActive: form.isActive } : {}),
          ...(iconUrl ? { icon: iconUrl } : {}),
          ...(isEdit && clearIcon ? { clearIcon: true } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || (isEdit ? "Failed to update subject" : "Failed to create subject"));
        return;
      }
      if (isEdit) {
        setSubjects((prev) =>
          prev.map((s) => (s._id === dialog.subject._id ? { ...s, ...data.subject } : s)),
        );
        toast.success("Subject updated");
      } else {
        setSubjects((prev) => [...prev, data.subject]);
        toast.success("Subject created");
      }
      setDialog(null);
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/subjects/${deleteId}`, { method: "DELETE" });
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
      setDeleting(false);
    }
  };

  const visible = subjects.filter((subject) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return (
      subject.name.toLowerCase().includes(term) ||
      subject.slug?.toLowerCase().includes(term) ||
      subject.category?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  const editing = dialog?.kind === "edit" ? dialog.subject : null;
  const shownIcon = iconPreview && !clearIcon ? iconPreview : "";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subjects</h1>
          <p className="text-slate-500 mt-1">Manage subjects, categories, and logo images</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold rounded-xl text-sm hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subjects..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3 font-medium text-slate-500 w-12">#</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Subject</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Category</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Materials</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Status</th>
                <th className="text-right px-6 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visible.map((subject, index) => (
                <tr key={subject._id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-xs text-slate-400 tabular-nums">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={subject.icon || DEFAULT_ICON} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{subject.name}</p>
                        {subject.description ? (
                          <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">{subject.description}</p>
                        ) : (
                          <p className="text-xs text-slate-400">{subject.slug}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-xs font-medium capitalize">
                      {subject.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 tabular-nums">{subject.materialsCount || 0}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        subject.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}
                    >
                      {subject.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(subject)}
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visible.length === 0 && (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              {subjects.length === 0 ? "No subjects yet. Add your first subject." : "No subjects match your search."}
            </p>
          </div>
        )}
      </div>

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={closeDialog}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]"
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{editing ? "Edit subject" : "Add subject"}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editing ? `/${editing.slug} · ${editing.materialsCount || 0} materials` : "Students see this name and logo across the site and app."}
                </p>
              </div>
              <button type="button" onClick={closeDialog} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 overflow-y-auto">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={shownIcon || DEFAULT_ICON} alt="" className={`w-full h-full object-contain bg-white ${shownIcon ? "" : "opacity-60"}`} />
                </div>
                <div className="space-y-2 min-w-0">
                  <p className="text-sm font-medium text-slate-800">Logo</p>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:border-violet-300 hover:bg-violet-50 cursor-pointer">
                      <ImagePlus className="w-3.5 h-3.5" />
                      {shownIcon ? "Replace" : "Upload"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => pickIcon(e.target.files?.[0])} />
                    </label>
                    {shownIcon ? (
                      <button
                        type="button"
                        onClick={removeIcon}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {iconFile?.name || "Square PNG, JPG, or WebP works best"}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                  placeholder="e.g., Data Structures"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">Description</label>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {form.description.length}/{DESCRIPTION_LIMIT}
                  </span>
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value.slice(0, DESCRIPTION_LIMIT) })}
                  rows={3}
                  placeholder="What students will find in this subject"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, category: c })}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        form.category === c
                          ? "bg-violet-600 border-violet-600 text-white"
                          : "bg-white border-slate-200 text-slate-600 hover:border-violet-300"
                      }`}
                    >
                      {label(c)}
                    </button>
                  ))}
                </div>
              </div>

              {editing ? (
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Visible to students</p>
                    <p className="text-xs text-slate-500">Inactive subjects stay hidden on the site and app.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isActive}
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${form.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        form.isActive ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                type="button"
                onClick={closeDialog}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.name.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editing ? (saving ? "Updating..." : "Save changes") : saving ? "Creating..." : "Create subject"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Subject"
        message="Are you sure? This will permanently delete this subject. Subjects with materials cannot be deleted."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
