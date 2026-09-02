"use client";

import { useState, useEffect } from "react";
import { HiOutlineStar, HiOutlineTrash, HiOutlineCheck, HiOutlineX } from "react-icons/hi";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import toast from "react-hot-toast";

interface FeedbackItem {
  _id: string;
  name: string;
  email: string;
  type?: "feedback" | "bug";
  bugType?: string;
  subject?: string;
  platform?: string;
  rating?: number;
  message: string;
  isApproved: boolean;
  createdAt: string;
}

const BUG_TYPE_LABELS: Record<string, string> = {
  crash: "App crash or freeze",
  login: "Login or signup",
  upload: "Uploading materials",
  download: "Download or preview",
  search: "Search or filters",
  notifications: "Notifications",
  ui: "Display or layout",
  performance: "Slow performance",
  other: "Something else",
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      setFeedback(data.feedback || []);
    } catch {
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (id: string, currentApproval: boolean) => {
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isApproved: !currentApproval }),
      });
      if (res.ok) {
        setFeedback((prev) =>
          prev.map((f) => (f._id === id ? { ...f, isApproved: !currentApproval } : f))
        );
        toast.success(currentApproval ? "Feedback unapproved" : "Feedback approved");
      }
    } catch {
      toast.error("Failed to update feedback");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/feedback?id=${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setFeedback((prev) => prev.filter((f) => f._id !== deleteId));
        toast.success("Feedback deleted");
      }
    } catch {
      toast.error("Failed to delete feedback");
    } finally {
      setDeleteId(null);
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Feedback & Bug Reports</h1>
        <p className="text-slate-500 text-sm mt-1">
          Submissions from the website and mobile app. {feedback.length} total.
        </p>
      </div>

      {feedback.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <HiOutlineStar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No feedback received yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {feedback.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl border border-slate-100 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                        item.type === "bug"
                          ? "bg-red-50 text-red-700"
                          : "bg-violet-50 text-violet-700"
                      }`}
                    >
                      {item.type === "bug" ? "Bug" : "Feedback"}
                    </span>
                    {item.type === "bug" && item.bugType && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600">
                        {BUG_TYPE_LABELS[item.bugType] || item.bugType}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                        item.isApproved
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {item.isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.email}</p>
                </div>
                {item.type !== "bug" && Boolean(item.rating) && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <HiOutlineStar
                        key={i}
                        className={`w-4 h-4 ${
                          i < (item.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              {item.subject && (
                <p className="text-sm font-semibold text-slate-900 mb-1">{item.subject}</p>
              )}
              <p className="text-sm text-slate-700 mb-3">{item.message}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {item.platform ? `${item.platform} · ` : ""}
                  {new Date(item.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleApproval(item._id, item.isApproved)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      item.isApproved
                        ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                        : "text-green-700 bg-green-50 hover:bg-green-100"
                    }`}
                  >
                    {item.isApproved ? (
                      <>
                        <HiOutlineX className="w-3.5 h-3.5" /> Unapprove
                      </>
                    ) : (
                      <>
                        <HiOutlineCheck className="w-3.5 h-3.5" /> Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteId(item._id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Feedback"
        message="Are you sure you want to delete this feedback?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
