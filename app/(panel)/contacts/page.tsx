"use client";

import { useState, useEffect } from "react";
import { HiOutlineMail, HiOutlineTrash } from "react-icons/hi";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import toast from "react-hot-toast";

interface ContactMsg {
  _id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: "new" | "read" | "replied";
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-50 text-blue-700" },
  read: { label: "Read", color: "bg-slate-100 text-slate-600" },
  replied: { label: "Replied", color: "bg-green-50 text-green-700" },
};

export default function ContactsPage() {
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      toast.error("Failed to load contact messages");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch("/api/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m._id === id ? { ...m, status: status as ContactMsg["status"] } : m))
        );
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/contacts?id=${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m._id !== deleteId));
        toast.success("Message deleted");
      }
    } catch {
      toast.error("Failed to delete message");
    } finally {
      setDeleteId(null);
    }
  };

  const handleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    // Mark as read when expanding a new message
    const msg = messages.find((m) => m._id === id);
    if (msg && msg.status === "new") {
      updateStatus(id, "read");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Contact Messages</h1>
        <p className="text-slate-500 text-sm mt-1">
          Messages from the contact form. {messages.length} total
          {newCount > 0 && <span className="text-blue-600 font-medium"> · {newCount} new</span>}
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <HiOutlineMail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No contact messages yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
          {messages.map((msg) => {
            const statusInfo = statusConfig[msg.status] || statusConfig.new;
            const isExpanded = expandedId === msg._id;

            return (
              <div key={msg._id} className="group">
                <div
                  className={`px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                    msg.status === "new" ? "bg-blue-50/30" : ""
                  }`}
                  onClick={() => handleExpand(msg._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm shrink-0">
                        {msg.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm truncate ${msg.status === "new" ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                            {msg.name}
                          </p>
                          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {msg.subject || "No subject"} · {msg.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-400">
                        {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(msg._id);
                        }}
                        className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                    <div className="pl-12 space-y-3">
                      <div className="text-sm text-slate-700 whitespace-pre-wrap">
                        {msg.message}
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${msg.email}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
                        >
                          <HiOutlineMail className="w-3.5 h-3.5" />
                          Reply via Email
                        </a>
                        {msg.status !== "replied" && (
                          <button
                            onClick={() => updateStatus(msg._id, "replied")}
                            disabled={busyId === msg._id}
                            className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {busyId === msg._id ? "Updating..." : "Mark as Replied"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Message"
        message="Are you sure you want to delete this contact message?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
