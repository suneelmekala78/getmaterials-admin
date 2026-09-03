"use client";

import { useState, useEffect } from "react";
import { UserCheck, UserX, Mail, Building2, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Teacher {
  _id: string;
  name: string;
  email: string;
  qualifications?: string;
  status: string;
  createdAt: string;
  assignedColleges?: { _id: string; name: string; code: string }[];
}

interface Application {
  _id: string;
  reason?: string;
  qualifications?: string;
  requestedCollegeName?: string;
  createdAt: string;
  user?: { _id: string; name: string; email: string };
  college?: { _id: string; name: string; code: string };
}

interface College {
  _id: string;
  name: string;
  code: string;
}

export default function TeachersPage() {
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
  const [approvedTeachers, setApprovedTeachers] = useState<Teacher[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // College assignment
  const [assigningTeacher, setAssigningTeacher] = useState<string | null>(null);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, collegesRes] = await Promise.all([
        fetch("/api/teachers").then((r) => r.json()),
        fetch("/api/colleges").then((r) => r.json()),
      ]);
      setPendingTeachers(teachersRes.pending || []);
      setApprovedTeachers(teachersRes.approved || []);
      setApplications(teachersRes.applications || []);
      setColleges(collegesRes.colleges || []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplication = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/role-change-requests/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Teacher request approved");
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to approve");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectApplication = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/role-change-requests/${id}/reject`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Teacher request rejected — user stays a student");
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to reject");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/teachers/${id}/approve`, { method: "POST" });
      if (res.ok) {
        toast.success("Teacher approved");
        fetchData();
      } else {
        toast.error("Failed to approve");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/teachers/${id}/reject`, { method: "POST" });
      if (res.ok) {
        toast.success("Teacher rejected");
        fetchData();
      } else {
        toast.error("Failed to reject");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const openAssignColleges = (teacher: Teacher) => {
    setAssigningTeacher(teacher._id);
    setSelectedColleges(teacher.assignedColleges?.map((c) => c._id) || []);
  };

  const toggleCollege = (collegeId: string) => {
    setSelectedColleges((prev) =>
      prev.includes(collegeId)
        ? prev.filter((id) => id !== collegeId)
        : [...prev, collegeId]
    );
  };

  const handleSaveColleges = async () => {
    if (!assigningTeacher) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teachers/${assigningTeacher}/colleges`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeIds: selectedColleges }),
      });
      if (res.ok) {
        toast.success("Colleges assigned");
        setAssigningTeacher(null);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to assign colleges");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
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
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Teacher Management</h1>
        <p className="text-slate-500 mt-1">
          Review teacher applications and assign colleges
        </p>
      </div>

      {/* Student → teacher applications */}
      <div className="bg-white rounded-2xl border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            Teacher requests ({applications.length})
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Students who applied from their profile. Rejecting keeps their student access.
          </p>
        </div>
        {applications.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {applications.map((app) => (
              <div key={app._id} className="px-6 py-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {app.user?.name?.charAt(0)?.toUpperCase() || "T"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{app.user?.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {app.user?.email}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {app.college
                      ? `${app.college.name}${app.college.code ? ` (${app.college.code})` : ""}`
                      : app.requestedCollegeName
                        ? `Not listed — requested “${app.requestedCollegeName}”`
                        : "No college selected"}
                  </p>
                  {app.reason && (
                    <p className="text-xs text-slate-600 mt-1">{app.reason}</p>
                  )}
                  {app.qualifications && (
                    <p className="text-xs text-slate-400 mt-0.5">{app.qualifications}</p>
                  )}
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(app.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApproveApplication(app._id)}
                    disabled={actionLoading === app._id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleRejectApplication(app._id)}
                    disabled={actionLoading === app._id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <UserX className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <UserCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No pending teacher requests</p>
          </div>
        )}
      </div>

      {/* Legacy pending teacher signups */}
      {pendingTeachers.length > 0 && (
      <div className="bg-white rounded-2xl border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            Pending Approvals ({pendingTeachers.length})
          </h2>
        </div>

        {pendingTeachers.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {pendingTeachers.map((teacher) => (
              <div key={teacher._id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-sm font-semibold">
                  {teacher.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{teacher.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {teacher.email}
                  </p>
                  {teacher.qualifications && (
                    <p className="text-xs text-slate-400 mt-0.5">{teacher.qualifications}</p>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(teacher.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(teacher._id)}
                    disabled={actionLoading === teacher._id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(teacher._id)}
                    disabled={actionLoading === teacher._id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <UserX className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <UserCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No pending teacher applications</p>
          </div>
        )}
      </div>
      )}

      {/* Approved teachers with college assignment */}
      <div className="bg-white rounded-2xl border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            Approved Teachers ({approvedTeachers.length})
          </h2>
        </div>
        {approvedTeachers.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {approvedTeachers.map((teacher) => (
              <div key={teacher._id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white text-xs font-semibold">
                  {teacher.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{teacher.name}</p>
                  <p className="text-xs text-slate-500">{teacher.email}</p>
                  {teacher.assignedColleges && teacher.assignedColleges.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {teacher.assignedColleges.map((c) => (
                        <span
                          key={c._id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-medium rounded-full"
                        >
                          <Building2 className="w-2.5 h-2.5" />
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAssignColleges(teacher)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-medium rounded-lg hover:bg-violet-100 transition-colors cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    {teacher.assignedColleges?.length ? "Edit Colleges" : "Assign Colleges"}
                  </button>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-500">No approved teachers yet</p>
          </div>
        )}
      </div>

      {/* College Assignment Modal */}
      {assigningTeacher && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAssigningTeacher(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Assign Colleges</h3>
              <button
                onClick={() => setAssigningTeacher(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Select which colleges this teacher is associated with:
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2 mb-5">
              {colleges.length > 0 ? (
                colleges.map((college) => (
                  <label
                    key={college._id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedColleges.includes(college._id)
                        ? "border-violet-300 bg-violet-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedColleges.includes(college._id)}
                      onChange={() => toggleCollege(college._id)}
                      className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500 cursor-pointer"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{college.name}</p>
                      <p className="text-xs text-slate-500">{college.code}</p>
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">
                  No colleges added yet. Add colleges first.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setAssigningTeacher(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveColleges}
                disabled={saving}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : `Assign (${selectedColleges.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
