"use client";

import { useCallback, useEffect, useState } from "react";
import {
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineTrash,
} from "react-icons/hi";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { UserAvatar } from "@/components/UserAvatar";
import toast from "react-hot-toast";

interface PendingDeletion {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: string;
  deletionRequestedAt: string;
  deletionReason?: string;
  deletesAt: string;
}

function daysLeft(deletesAt: string) {
  const ms = new Date(deletesAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export default function AccountDeletionsPage() {
  const [pending, setPending] = useState<PendingDeletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [completeId, setCompleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/deletions");
      const data = await res.json();
      setPending(data.pending || []);
    } catch {
      toast.error("Could not load pending deletions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cancelDeletion = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/users/deletions/${id}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Cancel failed");
      setPending((prev) => prev.filter((u) => u._id !== id));
      toast.success("Deletion cancelled — user can keep their account");
    } catch (error: any) {
      toast.error(error.message || "Cancel failed");
    } finally {
      setBusyId(null);
    }
  };

  const completeDeletion = async () => {
    if (!completeId) return;
    setBusyId(completeId);
    try {
      const res = await fetch(`/api/users/deletions/${completeId}/complete`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setPending((prev) => prev.filter((u) => u._id !== completeId));
      toast.success("Account permanently deleted");
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    } finally {
      setBusyId(null);
      setCompleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Account deletions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Users who requested permanent deletion. They have 7 days to sign in again and cancel.
          Completing early removes the account plus materials, quizzes, reviews, and follows.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : pending.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
          <HiOutlineCheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-900">No pending deletions</p>
          <p className="text-xs text-slate-500 mt-1">New requests will appear here during the 7-day grace period.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
          {pending.map((user) => {
            const left = daysLeft(user.deletesAt);
            return (
              <div
                key={user._id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <UserAvatar name={user.name} image={user.avatar} size={44} />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <p className="text-xs text-slate-400 mt-1 capitalize">
                      {user.role} · requested{" "}
                      {new Date(user.deletionRequestedAt).toLocaleString("en-IN")}
                    </p>
                    {user.deletionReason ? (
                      <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-xl px-3 py-2">
                        <span className="font-medium text-slate-800">Reason: </span>
                        {user.deletionReason}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                    <HiOutlineClock className="w-3.5 h-3.5" />
                    {left === 0 ? "Due now" : `${left} day${left === 1 ? "" : "s"} left`}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Auto-deletes {new Date(user.deletesAt).toLocaleDateString("en-IN")}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      disabled={busyId === user._id}
                      onClick={() => cancelDeletion(user._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 disabled:opacity-50"
                    >
                      <HiOutlineBan className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={busyId === user._id}
                      onClick={() => setCompleteId(user._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                      Delete now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(completeId)}
        title="Permanently delete now?"
        message="This immediately removes the user account and their materials, quizzes, reviews, and follows. This cannot be undone."
        confirmLabel={busyId ? "Deleting…" : "Delete permanently"}
        variant="danger"
        onConfirm={completeDeletion}
        onCancel={() => {
          if (!busyId) setCompleteId(null);
        }}
      />
    </div>
  );
}
