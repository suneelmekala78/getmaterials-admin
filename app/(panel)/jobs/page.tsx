"use client";

import { useEffect, useState } from "react";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineEye,
  HiOutlineExternalLink,
} from "react-icons/hi";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import toast from "react-hot-toast";

type EmploymentType =
  | "full_time"
  | "part_time"
  | "internship"
  | "contract"
  | "remote";

type ApplyMode = "internal" | "external";

interface Job {
  _id: string;
  title: string;
  slug: string;
  company: string;
  location: string;
  employmentType: EmploymentType;
  description: string;
  applyMode: ApplyMode;
  externalUrl?: string;
  isActive: boolean;
  applicationCount?: number;
  createdAt: string;
}

interface JobApplication {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  coverNote?: string;
  resumeUrl?: string;
  status: string;
  createdAt: string;
  user?: { name: string; email: string; avatar?: string };
}

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  full_time: "Full time",
  part_time: "Part time",
  internship: "Internship",
  contract: "Contract",
  remote: "Remote",
};

function emptyForm() {
  return {
    title: "",
    company: "GetMaterials",
    location: "",
    employmentType: "full_time" as EmploymentType,
    description: "",
    applyMode: "internal" as ApplyMode,
    externalUrl: "",
    isActive: true,
  };
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [viewApps, setViewApps] = useState<{
    job: Job;
    applications: JobApplication[];
  } | null>(null);
  const [appsLoading, setAppsLoading] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/admin/jobs");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchJobs();
  }, []);

  const openCreate = () => {
    setEditJob(null);
    setForm(emptyForm());
    setError("");
    setFormOpen(true);
  };

  const openEdit = (job: Job) => {
    setEditJob(job);
    setForm({
      title: job.title || "",
      company: job.company || "GetMaterials",
      location: job.location || "",
      employmentType: job.employmentType || "full_time",
      description: job.description || "",
      applyMode: job.applyMode || "internal",
      externalUrl: job.externalUrl || "",
      isActive: job.isActive !== false,
    });
    setError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditJob(null);
    setForm(emptyForm());
    setError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      ...form,
      externalUrl: form.applyMode === "external" ? form.externalUrl : "",
    };
    try {
      const res = await fetch(
        editJob ? `/api/admin/jobs/${editJob._id}` : "/api/admin/jobs",
        {
          method: editJob ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save job");
      } else {
        closeForm();
        toast.success(editJob ? "Job updated" : "Job created");
        void fetchJobs();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/jobs/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j._id !== deleteId));
        toast.success("Job deleted");
      } else {
        toast.error("Failed to delete job");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteId(null);
    }
  };

  const toggleActive = async (job: Job) => {
    try {
      await fetch(`/api/admin/jobs/${job._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !job.isActive }),
      });
      setJobs((prev) =>
        prev.map((j) =>
          j._id === job._id ? { ...j, isActive: !job.isActive } : j,
        ),
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const viewApplications = async (job: Job) => {
    setAppsLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/${job._id}/applications`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setViewApps({ job: data.job || job, applications: data.applications || [] });
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setAppsLoading(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage careers openings shown on getmaterials.in/careers
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors"
        >
          <HiOutlinePlus className="text-lg" />
          Add job
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
        {jobs.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No jobs yet.</p>
        ) : (
          jobs.map((job) => (
            <div
              key={job._id}
              className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-900 truncate">{job.title}</h2>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${
                      job.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {job.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700">
                    {EMPLOYMENT_LABELS[job.employmentType] || job.employmentType}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {job.company} · {job.location || "—"} · {job.applyMode}
                  {job.applyMode === "external" && job.externalUrl ? (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        href={job.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-violet-600 inline-flex items-center gap-0.5"
                      >
                        link <HiOutlineExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  ) : null}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {job.applicationCount || 0} application
                  {(job.applicationCount || 0) === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleActive(job)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  {job.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  disabled={appsLoading}
                  onClick={() => viewApplications(job)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-50"
                >
                  <HiOutlineEye className="w-3.5 h-3.5" />
                  Applications
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(job)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <HiOutlinePencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(job._id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  <HiOutlineTrash className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900">
              {editJob ? "Edit job" : "Create job"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              {error ? (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              ) : null}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company
                  </label>
                  <input
                    value={form.company}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, company: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Location
                  </label>
                  <input
                    value={form.location}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, location: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Employment type
                </label>
                <select
                  value={form.employmentType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      employmentType: e.target.value as EmploymentType,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                >
                  {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={6}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Apply mode
                </label>
                <select
                  value={form.applyMode}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      applyMode: e.target.value as ApplyMode,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                >
                  <option value="internal">Internal (in-app form)</option>
                  <option value="external">External URL</option>
                </select>
              </div>
              {form.applyMode === "external" ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    External URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="url"
                    value={form.externalUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, externalUrl: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              ) : null}
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                Active (visible on careers page)
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : editJob ? "Save changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewApps && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Applications — {viewApps.job.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {viewApps.applications.length} total
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewApps(null)}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
            {viewApps.applications.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                No applications yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {viewApps.applications.map((app) => (
                  <div key={app._id} className="p-4 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{app.name}</p>
                      <span className="text-[11px] font-semibold capitalize px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {app.email}
                      {app.phone ? ` · ${app.phone}` : ""}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(app.createdAt).toLocaleString("en-IN")}
                    </p>
                    {app.coverNote ? (
                      <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2 mt-2 whitespace-pre-wrap">
                        {app.coverNote}
                      </p>
                    ) : null}
                    {app.resumeUrl ? (
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-violet-600 inline-flex items-center gap-1"
                      >
                        Resume <HiOutlineExternalLink className="w-3 h-3" />
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete job?"
        message="This removes the job and all applications. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
