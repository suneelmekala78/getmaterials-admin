"use client";

import { useState, useEffect } from "react";
import { HiOutlinePlus, HiOutlineTrash, HiOutlineEye, HiOutlinePencil } from "react-icons/hi";
import { BarChart3 } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import ThumbnailPicker from "@/components/ThumbnailPicker";
import toast from "react-hot-toast";

interface Poll {
  _id: string;
  question: string;
  slug?: string;
  description?: string;
  type: "rating" | "yes_no" | "multiple_choice" | "text";
  options?: string[];
  thumbnailUrl?: string;
  responseCount: number;
  isActive: boolean;
  createdAt: string;
}

interface PollResponse {
  user: { name: string; email: string; role: string };
  answer: string;
  createdAt: string;
}

interface PollWithResponses extends Poll {
  responses: PollResponse[];
}

const typeLabels = {
  rating: "Rating (1-5)",
  yes_no: "Yes / No",
  multiple_choice: "Multiple Choice",
  text: "Open Text",
};

function emptyForm() {
  return {
    question: "",
    description: "",
    type: "yes_no" as Poll["type"],
    options: ["", ""],
    thumbnailUrl: "",
  };
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editPoll, setEditPoll] = useState<Poll | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewPoll, setViewPoll] = useState<PollWithResponses | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<Poll["type"]>("yes_no");
  const [options, setOptions] = useState(["", ""]);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const res = await fetch("/api/polls");
      const data = await res.json();
      setPolls(data.polls || []);
    } catch {
      toast.error("Failed to load polls");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const form = emptyForm();
    setQuestion(form.question);
    setDescription(form.description);
    setType(form.type);
    setOptions(form.options);
    setThumbnailUrl(form.thumbnailUrl);
    setError("");
  };

  const openCreate = () => {
    resetForm();
    setEditPoll(null);
    setShowCreate(true);
  };

  const openEdit = (poll: Poll) => {
    setQuestion(poll.question || "");
    setDescription(poll.description || "");
    setType(poll.type);
    setOptions(
      poll.type === "multiple_choice" && poll.options?.length
        ? [...poll.options]
        : ["", ""]
    );
    setThumbnailUrl(poll.thumbnailUrl || "");
    setError("");
    setEditPoll(poll);
    setShowCreate(false);
  };

  const closeForm = () => {
    setShowCreate(false);
    setEditPoll(null);
    resetForm();
  };

  const viewResponses = async (pollId: string) => {
    setViewLoading(true);
    try {
      const res = await fetch(`/api/polls/${pollId}`);
      const data = await res.json();
      if (res.ok) {
        setViewPoll(data.poll);
      } else {
        toast.error("Failed to load poll responses");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setViewLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      question,
      description,
      type,
      thumbnailUrl: thumbnailUrl || undefined,
      options: type === "multiple_choice" ? options.filter((o) => o.trim()) : undefined,
    };

    try {
      const res = await fetch(editPoll ? `/api/polls/${editPoll._id}` : "/api/polls", {
        method: editPoll ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (editPoll ? "Failed to update poll" : "Failed to create poll"));
      } else {
        closeForm();
        fetchPolls();
        toast.success(editPoll ? "Poll updated" : "Poll created");
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
      const res = await fetch(`/api/polls/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setPolls((prev) => prev.filter((p) => p._id !== deleteId));
        toast.success("Poll deleted");
      } else {
        toast.error("Failed to delete poll");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeleteId(null);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/polls/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      setPolls((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isActive: !isActive } : p))
      );
    } catch {
      toast.error("Failed to update poll status");
    }
  };

  const formOpen = showCreate || !!editPoll;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Polls & Surveys</h1>
          <p className="text-slate-500 text-sm mt-1">
            Ask users questions like &quot;How does GetMaterials feel?&quot; or &quot;Should we add this feature?&quot;
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors"
        >
          <HiOutlinePlus className="text-lg" />
          Create Poll
        </button>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900">
              {editPoll ? "Edit Poll" : "Create Poll"}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Question <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                  placeholder="e.g., How does GetMaterials feel to you?"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context for users..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Response Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Poll["type"])}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                >
                  <option value="yes_no">Yes / No</option>
                  <option value="rating">Rating (1-5 stars)</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="text">Open Text</option>
                </select>
              </div>

              <ThumbnailPicker value={thumbnailUrl} onChange={setThumbnailUrl} />

              {editPoll?.slug ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Public URL</label>
                  <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 font-mono text-xs text-slate-500">
                    /polls/{editPoll.slug}
                  </p>
                </div>
              ) : null}

              {type === "multiple_choice" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Options <span className="text-red-500">*</span>
                  </label>
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...options];
                          newOpts[idx] = e.target.value;
                          setOptions(newOpts);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                          className="p-2 text-red-400 hover:text-red-600"
                        >
                          <HiOutlineTrash />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setOptions([...options, ""])}
                    className="text-xs text-violet-600 font-medium hover:underline"
                  >
                    + Add option
                  </button>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-medium text-sm rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-violet-600 text-white font-medium text-sm rounded-xl hover:bg-violet-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editPoll ? "Save Changes" : "Create Poll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {polls.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <p className="text-slate-500">No polls yet. Create your first poll to get user feedback!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {polls.map((poll) => (
            <div key={poll._id} className="bg-white rounded-xl border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-20 h-14 rounded-lg overflow-hidden border border-slate-100 bg-slate-100 shrink-0">
                    {poll.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={poll.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900">{poll.question}</h3>
                    {poll.slug ? (
                      <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                        /polls/{poll.slug}
                      </p>
                    ) : null}
                    {poll.description && (
                      <p className="text-sm text-slate-500 mt-0.5">{poll.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded">
                        {typeLabels[poll.type]}
                      </span>
                      <span className="text-xs text-slate-400">{poll.responseCount} responses</span>
                      <span className="text-xs text-slate-400">
                        {new Date(poll.createdAt).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => viewResponses(poll._id)}
                    className="p-2 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-violet-50"
                    title="View Responses"
                    disabled={viewLoading}
                  >
                    <HiOutlineEye className="text-lg" />
                  </button>
                  <button
                    onClick={() => openEdit(poll)}
                    className="p-2 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-violet-50"
                    title="Edit Poll"
                  >
                    <HiOutlinePencil className="text-lg" />
                  </button>
                  <button
                    onClick={() => toggleActive(poll._id, poll.isActive)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      poll.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {poll.isActive ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => setDeleteId(poll._id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <HiOutlineTrash className="text-lg" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewPoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{viewPoll.question}</h2>
                  {viewPoll.description && (
                    <p className="text-sm text-slate-500 mt-0.5">{viewPoll.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded">
                      {typeLabels[viewPoll.type]}
                    </span>
                    <span className="text-xs text-slate-500">
                      {viewPoll.responses?.length || 0} responses
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewPoll(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!viewPoll.responses || viewPoll.responses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No responses yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {viewPoll.responses.map((resp, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {resp.user?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">
                            {resp.user?.name || "Unknown"}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-medium rounded capitalize ${
                              resp.user?.role === "teacher"
                                ? "bg-violet-50 text-violet-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {resp.user?.role || "user"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{resp.user?.email}</p>
                        <p className="text-sm text-slate-700 mt-1 font-medium">{resp.answer}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(resp.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Poll"
        message="Are you sure? All responses will be lost."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
