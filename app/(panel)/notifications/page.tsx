"use client";

import { useState, useEffect } from "react";
import {
  HiOutlineBell,
  HiOutlinePaperAirplane,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlineDeviceMobile,
} from "react-icons/hi";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import toast from "react-hot-toast";

type Audience = "all" | "students" | "teachers" | "admins" | "college" | "user";
type NotificationType = "announcement" | "material" | "quiz" | "reminder" | "update";

interface SentNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  link: string | null;
  audience: Audience;
  college: string | null;
  targetUser: { name: string; email: string } | null;
  createdBy: string | null;
  recipientCount: number;
  readCount: number;
  pushSent: number;
  pushFailed: number;
  createdAt: string;
}

interface AudienceStat {
  users: number;
  devices: number;
}

const audienceOptions: { value: Audience; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "students", label: "Students only" },
  { value: "teachers", label: "Teachers only" },
  { value: "admins", label: "Admins only" },
  { value: "college", label: "A specific college" },
  { value: "user", label: "A specific user" },
];

const typeOptions: { value: NotificationType; label: string }[] = [
  { value: "announcement", label: "Announcement" },
  { value: "material", label: "New material" },
  { value: "quiz", label: "Quiz" },
  { value: "reminder", label: "Reminder" },
  { value: "update", label: "App update" },
];

const audienceLabels: Record<Audience, string> = {
  all: "Everyone",
  students: "Students",
  teachers: "Teachers",
  admins: "Admins",
  college: "College",
  user: "Single user",
};

export default function NotificationsPage() {
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [stats, setStats] = useState<Record<string, AudienceStat>>({});
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<NotificationType>("announcement");
  const [audience, setAudience] = useState<Audience>("all");
  const [link, setLink] = useState("");
  const [college, setCollege] = useState("");
  const [targetUser, setTargetUser] = useState("");

  const [colleges, setColleges] = useState<{ _id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ _id: string; name: string; email: string }[]>([]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (audience === "college" && colleges.length === 0) {
      fetch("/api/colleges")
        .then((res) => res.json())
        .then((data) => setColleges(data.colleges || []))
        .catch(() => toast.error("Failed to load colleges"));
    }
    if (audience === "user" && users.length === 0) {
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => setUsers(data.users || []))
        .catch(() => toast.error("Failed to load users"));
    }
  }, [audience, colleges.length, users.length]);

  const load = async () => {
    try {
      const [historyRes, statsRes] = await Promise.all([
        fetch("/api/admin/notifications"),
        fetch("/api/admin/notifications/audiences"),
      ]);
      const historyData = await historyRes.json();
      const statsData = await statsRes.json();
      setHistory(historyData.notifications || []);
      setStats(statsData.stats || {});
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          type,
          audience,
          link: link || undefined,
          college: audience === "college" ? college : undefined,
          targetUser: audience === "user" ? targetUser : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send notification");
        return;
      }
      toast.success(
        `Sent to ${data.delivery.recipients} user(s) · ${data.delivery.pushSent} push delivered`
      );
      setTitle("");
      setBody("");
      setLink("");
      load();
    } catch {
      setError("Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/notifications?id=${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((n) => n.id !== deleteId));
        toast.success("Notification removed");
      } else {
        toast.error("Failed to remove notification");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeleteId(null);
    }
  };

  const currentStat = stats[audience];

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
        <h1 className="text-2xl font-bold text-slate-900">App Notifications</h1>
        <p className="text-slate-500 text-sm mt-1">
          Send a push notification to the mobile app. It also appears in the
          in-app notification inbox.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <form
          onSubmit={handleSend}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 space-y-4 h-fit"
        >
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              maxLength={120}
              placeholder="e.g., New DSA notes are live"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              minLength={5}
              maxLength={500}
              rows={4}
              placeholder="Keep it short — this is what shows on the lock screen."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{body.length}/500</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NotificationType)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-violet-500"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as Audience)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-violet-500"
              >
                {audienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {audience === "college" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                College
              </label>
              <select
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-violet-500"
              >
                <option value="">Select a college</option>
                {colleges.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {audience === "user" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                User
              </label>
              <select
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-violet-500"
              >
                <option value="">Select a user</option>
                {users.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} · {item.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Deep link (optional)
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/materials or /material/<id>"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Where the app should navigate when the notification is tapped.
            </p>
          </div>

          {currentStat && (
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <HiOutlineUsers className="text-base text-slate-400" />
                {currentStat.users} recipients
              </span>
              <span className="inline-flex items-center gap-1.5">
                <HiOutlineDeviceMobile className="text-base text-slate-400" />
                {currentStat.devices} with the app installed
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white font-semibold text-sm rounded-xl hover:bg-violet-700 disabled:opacity-50"
          >
            <HiOutlinePaperAirplane className="text-lg" />
            {sending ? "Sending..." : "Send Notification"}
          </button>
        </form>

        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Sent history {history.length > 0 && `(${history.length})`}
          </h2>

          {history.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <HiOutlineBell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No notifications sent yet.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-100 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-50 text-violet-700 capitalize">
                        {item.type}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600">
                        {item.audience === "college" && item.college
                          ? item.college
                          : item.audience === "user" && item.targetUser
                            ? item.targetUser.email
                            : audienceLabels[item.audience]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-1">{item.body}</p>
                    {item.link && (
                      <p className="text-xs text-violet-600 mt-1">{item.link}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteId(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-400 flex-wrap">
                  <span>{item.recipientCount} recipients</span>
                  <span>{item.pushSent} delivered</span>
                  {item.pushFailed > 0 && (
                    <span className="text-amber-600">
                      {item.pushFailed} failed
                    </span>
                  )}
                  <span>{item.readCount} read</span>
                  <span>
                    {item.createdBy ? `${item.createdBy} · ` : ""}
                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Remove Notification"
        message="This removes it from the in-app inbox. Already delivered pushes cannot be recalled."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
