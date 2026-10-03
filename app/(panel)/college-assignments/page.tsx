"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Pencil, X, Filter } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import toast from "react-hot-toast";

interface CollegeProgram {
  key: string;
  label: string;
  durationYears: number;
  totalSemesters: number;
}

interface CollegeBranch {
  program: string;
  name: string;
  sections: string[];
}

interface Assignment {
  _id: string;
  college: { _id: string; name: string; code: string };
  subject: { _id: string; name: string };
  chapter?: { _id: string; title: string };
  semester: number;
  unit?: number;
  program: string;
  branch?: string;
  section?: string;
  batchStart: number;
  batchEnd: number;
  materialType?: string;
}

interface College {
  _id: string;
  name: string;
  code: string;
  programs: CollegeProgram[];
  branches: CollegeBranch[];
}

interface SubjectItem {
  _id: string;
  name: string;
}

interface ChapterItem {
  _id: string;
  title: string;
  subject: string;
}

const materialTypes = [
  { value: "", label: "Any type" },
  { value: "notes", label: "Notes" },
  { value: "question_paper", label: "Question Paper" },
  { value: "syllabus", label: "Syllabus" },
  { value: "assignment", label: "Assignment" },
  { value: "lab_manual", label: "Lab Manual" },
  { value: "reference", label: "Reference" },
  { value: "other", label: "Other" },
];

export default function CollegeAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Filter
  const [filterCollege, setFilterCollege] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  // Form state
  const [form, setForm] = useState({
    college: "",
    subject: "",
    chapter: "",
    semester: 1,
    unit: "",
    program: "",
    branch: "",
    section: "",
    batchStart: new Date().getFullYear(),
    batchEnd: new Date().getFullYear() + 4,
    materialType: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [assignRes, collegeRes, subjectRes, chapterRes] = await Promise.all([
        fetch("/api/college-assignments").then((r) => r.json()),
        fetch("/api/colleges").then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
        fetch("/api/chapters").then((r) => r.json()),
      ]);
      setAssignments(assignRes.assignments || []);
      setColleges(collegeRes.colleges || []);
      setSubjects(subjectRes.subjects || []);
      setChapters(chapterRes.chapters || []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      college: "",
      subject: "",
      chapter: "",
      semester: 1,
      unit: "",
      program: "",
      branch: "",
      section: "",
      batchStart: new Date().getFullYear(),
      batchEnd: new Date().getFullYear() + 4,
      materialType: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (a: Assignment) => {
    setEditingId(a._id);
    setForm({
      college: a.college._id,
      subject: a.subject._id,
      chapter: a.chapter?._id || "",
      semester: a.semester,
      unit: a.unit?.toString() || "",
      program: a.program,
      branch: a.branch || "",
      section: a.section || "",
      batchStart: a.batchStart,
      batchEnd: a.batchEnd,
      materialType: a.materialType || "",
    });
    setShowForm(true);
  };

  useEffect(() => {
    if (!showForm) return;
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [showForm, editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        college: form.college,
        subject: form.subject,
        chapter: form.chapter || undefined,
        semester: form.semester,
        unit: form.unit ? parseInt(form.unit) : undefined,
        program: form.program,
        branch: form.branch || undefined,
        section: form.section || undefined,
        batchStart: form.batchStart,
        batchEnd: form.batchEnd,
        materialType: form.materialType || undefined,
      };

      const method = editingId ? "PATCH" : "POST";
      const res = await fetch("/api/college-assignments", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      toast.success(editingId ? "Assignment updated" : "Assignment created");
      resetForm();
      // Refresh
      const refreshed = await fetch("/api/college-assignments").then((r) => r.json());
      setAssignments(refreshed.assignments || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/college-assignments?id=${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setAssignments((prev) => prev.filter((a) => a._id !== deleteId));
        toast.success("Assignment deleted");
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteId(null);
      setDeleting(false);
    }
  };

  const filteredChapters = chapters.filter(
    (c: any) => (c.subject?._id || c.subject) === form.subject
  );

  // Get selected college's programs/branches/sections
  const selectedCollege = colleges.find((c) => c._id === form.college);
  const collegePrograms = selectedCollege?.programs || [];
  const collegeBranches = (selectedCollege?.branches || []).filter(
    (b) => b.program === form.program
  );
  const selectedBranch = collegeBranches.find((b) => b.name === form.branch);
  const branchSections = selectedBranch?.sections || [];
  const selectedProgram = collegePrograms.find((p) => p.key === form.program);
  const maxSemesters = selectedProgram?.totalSemesters || 10;

  const filteredAssignments = assignments.filter((a) => {
    if (filterCollege && a.college._id !== filterCollege) return false;
    if (filterSubject && a.subject._id !== filterSubject) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">College Subjects</h1>
          <p className="text-slate-500 mt-1">
            Assign subjects to colleges — specify program, branch, semester, section & batch.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white font-medium text-sm rounded-xl hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Assignment
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div ref={formRef} className="bg-white rounded-2xl p-6 border border-slate-100 scroll-mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              {editingId ? "Edit Assignment" : "New Assignment"}
            </h2>
            <button onClick={resetForm} className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">College *</label>
                <select
                  value={form.college}
                  onChange={(e) => setForm({ ...form, college: e.target.value, program: "", branch: "", section: "" })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                >
                  <option value="">Select college</option>
                  {colleges.map((c) => (
                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Program *</label>
                <select
                  value={form.program}
                  onChange={(e) => setForm({ ...form, program: e.target.value, branch: "", section: "" })}
                  required
                  disabled={!form.college}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <option value="">Select program</option>
                  {collegePrograms.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Branch</label>
                <select
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value, section: "" })}
                  disabled={!form.program || collegeBranches.length === 0}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <option value="">All branches</option>
                  {collegeBranches.map((b, i) => (
                    <option key={i} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Section</label>
                <select
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  disabled={!form.branch || branchSections.length === 0}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <option value="">All sections</option>
                  {branchSections.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Semester *</label>
                <select
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                >
                  {Array.from({ length: maxSemesters }, (_, i) => i + 1).map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject *</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value, chapter: "" })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                >
                  <option value="">Select subject</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Chapter (optional)</label>
                <select
                  value={form.chapter}
                  onChange={(e) => setForm({ ...form, chapter: e.target.value })}
                  disabled={!form.subject}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <option value="">All chapters / Not specific</option>
                  {filteredChapters.map((c: any) => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Unit (optional)</label>
                <input
                  type="number"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="e.g., 1"
                  min={1}
                  max={10}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Material Type</label>
                <select
                  value={form.materialType}
                  onChange={(e) => setForm({ ...form, materialType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                >
                  {materialTypes.map((mt) => (
                    <option key={mt.value} value={mt.value}>{mt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Batch Start Year *</label>
                <input
                  type="number"
                  value={form.batchStart}
                  onChange={(e) => setForm({ ...form, batchStart: parseInt(e.target.value) })}
                  required
                  min={2000}
                  max={2100}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Batch End Year *</label>
                <input
                  type="number"
                  value={form.batchEnd}
                  onChange={(e) => setForm({ ...form, batchEnd: parseInt(e.target.value) })}
                  required
                  min={2000}
                  max={2100}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-violet-600 text-white font-medium text-sm rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (editingId ? "Updating..." : "Saving...") : editingId ? "Update Assignment" : "Create Assignment"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="px-5 py-2.5 text-slate-600 font-medium text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filterCollege}
          onChange={(e) => setFilterCollege(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:border-violet-500 cursor-pointer"
        >
          <option value="">All Colleges</option>
          {colleges.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:border-violet-500 cursor-pointer"
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 w-12">#</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">College</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Subject</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Program</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Branch</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Section</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Sem</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Batch</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Type</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssignments.map((a, index) => (
                <tr key={a._id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-xs text-slate-400 tabular-nums">{index + 1}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">{a.college?.name || "—"}</td>
                  <td className="px-5 py-3 text-slate-700">{a.subject?.name || "—"}</td>
                  <td className="px-5 py-3 text-slate-600 uppercase text-xs">{a.program}</td>
                  <td className="px-5 py-3 text-slate-600">{a.branch || "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{a.section || "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{a.semester}</td>
                  <td className="px-5 py-3 text-slate-600">{a.batchStart}–{a.batchEnd}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">{a.materialType?.replace("_", " ") || "Any"}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(a)}
                        className="p-1.5 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-violet-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(a._id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
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

        {filteredAssignments.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-500">
              No college subjects found. Assign subjects to a college&apos;s program, branch & semester.
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Assignment"
        message="Are you sure you want to delete this college assignment?"
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
