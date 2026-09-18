"use client";

import { useState, useEffect, useMemo } from "react";
import {
  HiOutlineBell,
  HiOutlinePaperAirplane,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlineDeviceMobile,
  HiOutlineMail,
  HiOutlineTemplate,
} from "react-icons/hi";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import toast from "react-hot-toast";

type Audience =
  | "all"
  | "students"
  | "teachers"
  | "admins"
  | "college"
  | "user"
  | "users"
  | "incomplete_profile"
  | "no_uploads";

type NotificationType =
  | "announcement"
  | "material"
  | "quiz"
  | "reminder"
  | "update";

interface SentNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  link: string | null;
  audience: Audience;
  college: string | null;
  targetUser: { name: string; email: string } | null;
  targetUsersCount?: number;
  channels?: { push: boolean; email: boolean };
  createdBy: string | null;
  recipientCount: number;
  readCount: number;
  pushSent: number;
  pushFailed: number;
  emailSent?: number;
  emailFailed?: number;
  createdAt: string;
}

interface AudienceStat {
  users: number;
  devices: number;
}

interface NotifTemplate {
  id: string;
  label: string;
  title: string;
  body: string;
  type: NotificationType;
  link: string;
  audience: Audience;
  sendPush: boolean;
  sendEmail: boolean;
}

const audienceOptions: { value: Audience; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "students", label: "Students" },
  { value: "teachers", label: "Teachers" },
  { value: "admins", label: "Admins" },
  { value: "college", label: "College" },
  { value: "user", label: "Single user" },
  { value: "users", label: "Selected users" },
  { value: "incomplete_profile", label: "Incomplete profiles" },
  { value: "no_uploads", label: "Users with no uploads" },
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
  users: "Selected users",
  incomplete_profile: "Incomplete profiles",
  no_uploads: "No uploads",
};

const deepLinkPresets: { id: string; path: string; label: string }[] = [
  { id: "home", path: "/", label: "Home" },
  { id: "subjects", path: "/subjects", label: "Subjects" },
  { id: "categories", path: "/categories", label: "Categories (mobile)" },
  { id: "materials", path: "/materials", label: "Materials" },
  { id: "quizzes", path: "/quizzes", label: "Quizzes" },
  { id: "leaderboard", path: "/quizzes", label: "Leaderboard" },
  { id: "polls", path: "/polls", label: "Polls" },
  { id: "settings", path: "/settings", label: "Settings" },
  { id: "upload", path: "/upload", label: "Upload" },
  { id: "custom", path: "custom", label: "Custom" },
];

const templates: NotifTemplate[] = [
  {
    id: "new-materials",
    label: "New materials available",
    title: "New study materials are live",
    body: "Fresh notes and resources just landed. Open the app to browse what's new for your subjects.",
    type: "material",
    link: "/materials",
    audience: "all",
    sendPush: true,
    sendEmail: true,
  },
  {
    id: "complete-profile",
    label: "Complete your profile",
    title: "Finish setting up your profile",
    body: "Add a photo, banner, and short bio so classmates and teachers can recognize you on GetMaterials.",
    type: "reminder",
    link: "/settings",
    audience: "incomplete_profile",
    sendPush: true,
    sendEmail: true,
  },
  {
    id: "add-materials",
    label: "Upload your first material",
    title: "Share your first material",
    body: "Help your batch by uploading notes, PDFs, or videos. Your first upload unlocks contributor badges.",
    type: "reminder",
    link: "/upload",
    audience: "no_uploads",
    sendPush: true,
    sendEmail: true,
  },
  {
    id: "leaderboard",
    label: "Climb the quiz leaderboard",
    title: "Climb the quiz leaderboard",
    body: "Take a quiz and see how you rank against other students. Can you make the top 10?",
    type: "quiz",
    link: "/quizzes",
    audience: "students",
    sendPush: true,
    sendEmail: false,
  },
  {
    id: "new-quiz",
    label: "New quiz challenge",
    title: "A new quiz challenge awaits",
    body: "Test yourself with a fresh quiz. Short, focused, and a great way to revise before exams.",
    type: "quiz",
    link: "/quizzes",
    audience: "students",
    sendPush: true,
    sendEmail: false,
  },
  {
    id: "new-poll",
    label: "New poll",
    title: "New poll — cast your vote",
    body: "We've posted a new poll. Share your opinion and see what your peers think.",
    type: "announcement",
    link: "/polls",
    audience: "all",
    sendPush: true,
    sendEmail: false,
  },
  {
    id: "announcement",
    label: "General announcement",
    title: "An update from GetMaterials",
    body: "We have an important update for you. Open the app to read the full announcement.",
    type: "announcement",
    link: "/",
    audience: "all",
    sendPush: true,
    sendEmail: true,
  },
];

export default function NotificationsPage() {
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPages, setHistoryPages] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_LIMIT = 20;
  const [stats, setStats] = useState<Record<string, AudienceStat>>({});
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<NotificationType>("announcement");
  const [audience, setAudience] = useState<Audience>("all");
  const [link, setLink] = useState("");
  const [linkPreset, setLinkPreset] = useState("custom");
  const [college, setCollege] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [sendPush, setSendPush] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState("");

  const [colleges, setColleges] = useState<{ _id: string; name: string }[]>([]);
  const [users, setUsers] = useState<
    { _id: string; name: string; email: string }[]
  >([]);

  useEffect(() => {
    load(historyPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyPage]);

  useEffect(() => {
    if (audience === "college" && colleges.length === 0) {
      fetch("/api/colleges")
        .then((res) => res.json())
        .then((data) => setColleges(data.colleges || []))
        .catch(() => toast.error("Failed to load colleges"));
    }
    if (
      (audience === "user" || audience === "users") &&
      users.length === 0
    ) {
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => setUsers(data.users || []))
        .catch(() => toast.error("Failed to load users"));
    }
  }, [audience, colleges.length, users.length]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  }, [users, userSearch]);

  const load = async (page = historyPage) => {
    try {
      const [historyRes, statsRes] = await Promise.all([
        fetch(
          `/api/admin/notifications?page=${page}&limit=${HISTORY_LIMIT}`,
        ),
        fetch("/api/admin/notifications/audiences"),
      ]);
      const historyData = await historyRes.json();
      const statsData = await statsRes.json();
      setHistory(historyData.notifications || []);
      setHistoryTotal(historyData.total || 0);
      setHistoryPages(historyData.pages || 1);
      setHistoryPage(historyData.page || page);
      setStats(statsData.stats || {});
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    setActiveTemplate(templateId);
    const t = templates.find((item) => item.id === templateId);
    if (!t) return;
    setTitle(t.title);
    setBody(t.body);
    setType(t.type);
    setAudience(t.audience);
    setLink(t.link);
    setSendPush(t.sendPush);
    setSendEmail(t.sendEmail);
    const preset = deepLinkPresets.find((p) => p.path === t.link && p.id !== "custom");
    setLinkPreset(preset ? preset.id : "custom");
  };

  const handleLinkPreset = (presetId: string) => {
    setLinkPreset(presetId);
    const preset = deepLinkPresets.find((p) => p.id === presetId);
    if (preset && preset.id !== "custom") setLink(preset.path);
  };

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!sendPush && !sendEmail) {
      setError("Select at least one channel (Push or Email)");
      return;
    }
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
          targetUsers: audience === "users" ? selectedUsers : undefined,
          sendPush,
          sendEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send notification");
        return;
      }
      const parts = [`Sent to ${data.delivery.recipients} user(s)`];
      if (sendPush) parts.push(`${data.delivery.pushSent} push`);
      if (sendEmail) parts.push(`${data.delivery.emailSent ?? 0} email`);
      toast.success(parts.join(" · "));
      setTitle("");
      setBody("");
      setLink("");
      setLinkPreset("custom");
      setSelectedUsers([]);
      setActiveTemplate("");
      setHistoryPage(1);
      await load(1);
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
        toast.success("Removed from admin sent history");
        await load(historyPage);
      } else {
        toast.error("Failed to remove notification");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeleteId(null);
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/admin/notifications?all=1", {
        method: "DELETE",
      });
      if (res.ok) {
        setHistory([]);
        setHistoryTotal(0);
        setHistoryPages(1);
        setHistoryPage(1);
        toast.success("Admin sent history cleared");
      } else {
        toast.error("Failed to clear notifications");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setClearing(false);
      setClearAllOpen(false);
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
        <h1 className="text-2xl font-bold text-slate-900">
          App & Email Notifications
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Send push, in-app inbox, and optional email to users. Use a template
          or compose from scratch.
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <HiOutlineTemplate className="text-violet-500" />
                Template
              </span>
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto rounded-xl border border-slate-100 p-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTemplate === t.id
                      ? "bg-violet-50 text-violet-800 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Channels
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendPush}
                  onChange={(e) => setSendPush(e.target.checked)}
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                Push + in-app
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                Email
              </label>
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

          {audience === "users" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Selected users ({selectedUsers.length})
              </label>
              <input
                type="search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 mb-2"
              />
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <p className="p-3 text-xs text-slate-400">No users found</p>
                ) : (
                  filteredUsers.map((item) => (
                    <label
                      key={item._id}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(item._id)}
                        onChange={() => toggleUser(item._id)}
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="min-w-0 truncate">
                        <span className="font-medium text-slate-800">
                          {item.name}
                        </span>
                        <span className="text-slate-400"> · {item.email}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Deep link
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <select
                value={linkPreset}
                onChange={(e) => handleLinkPreset(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-violet-500"
              >
                {deepLinkPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  const match = deepLinkPresets.find(
                    (p) => p.path === e.target.value && p.id !== "custom",
                  );
                  setLinkPreset(match ? match.id : "custom");
                }}
                placeholder="/materials or /material/<id>"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <p className="text-xs text-slate-400">
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

          {audience === "users" && selectedUsers.length > 0 && (
            <p className="text-xs text-violet-600">
              {selectedUsers.length} user(s) selected
            </p>
          )}

          <button
            type="submit"
            disabled={sending || (audience === "users" && selectedUsers.length === 0)}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white font-semibold text-sm rounded-xl hover:bg-violet-700 disabled:opacity-50"
          >
            <HiOutlinePaperAirplane className="text-lg" />
            {sending ? "Sending..." : "Send Notification"}
          </button>
        </form>

        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Sent history{" "}
              {historyTotal > 0 && (
                <span className="font-normal text-slate-400">
                  ({historyTotal} total
                  {historyPages > 1
                    ? ` · page ${historyPage}/${historyPages}`
                    : ""}
                  )
                </span>
              )}
            </h2>
            {historyTotal > 0 && (
              <button
                type="button"
                onClick={() => setClearAllOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <HiOutlineTrash className="w-3.5 h-3.5" />
                Clear all
              </button>
            )}
          </div>

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
                      <p className="font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-50 text-violet-700 capitalize">
                        {item.type}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600">
                        {item.audience === "college" && item.college
                          ? item.college
                          : item.audience === "user" && item.targetUser
                            ? item.targetUser.email
                            : item.audience === "users"
                              ? `${item.targetUsersCount || item.recipientCount} users`
                              : audienceLabels[item.audience] || item.audience}
                      </span>
                      {item.channels?.email && (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-sky-50 text-sky-700 inline-flex items-center gap-0.5">
                          <HiOutlineMail className="w-3 h-3" />
                          Email
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mt-1">{item.body}</p>
                    {item.link && (
                      <p className="text-xs text-violet-600 mt-1">
                        {item.link}
                      </p>
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
                  <span>{item.pushSent} push</span>
                  {(item.pushFailed || 0) > 0 && (
                    <span className="text-amber-600">
                      {item.pushFailed} push failed
                    </span>
                  )}
                  {(item.emailSent || 0) > 0 && (
                    <span>{item.emailSent} email</span>
                  )}
                  {(item.emailFailed || 0) > 0 && (
                    <span className="text-amber-600">
                      {item.emailFailed} email failed
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

          {historyPages > 1 && (
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={historyPage <= 1}
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <p className="text-xs text-slate-500">
                Page {historyPage} of {historyPages}
              </p>
              <button
                type="button"
                disabled={historyPage >= historyPages}
                onClick={() =>
                  setHistoryPage((p) => Math.min(historyPages, p + 1))
                }
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Remove from sent history"
        message="This hides the notification from admin sent history only. User inboxes and already delivered pushes are not affected."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        open={clearAllOpen}
        title="Clear admin sent history"
        message={
          clearing
            ? "Clearing…"
            : "This clears the admin sent-history list only. Notifications stay in every user's inbox. Delivered pushes cannot be recalled."
        }
        confirmLabel="Clear history"
        variant="danger"
        onConfirm={handleClearAll}
        onCancel={() => !clearing && setClearAllOpen(false)}
      />
    </div>
  );
}
