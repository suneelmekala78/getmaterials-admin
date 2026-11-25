"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Topic = {
  id: string;
  key: string;
  label: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

type Thread = {
  id: string;
  title: string;
  isSticky: boolean;
  isLocked: boolean;
  reportCount: number;
  replyCount: number;
  topic?: { key: string; label: string } | null;
  author?: { name?: string } | null;
};

export default function AdminCommunityPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [reported, setReported] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [t, th, rep] = await Promise.all([
        fetch("/api/community/topics?all=1").then((r) => r.json()),
        fetch("/api/community/threads?limit=40").then((r) => r.json()),
        fetch("/api/community/threads?reported=1&limit=40").then((r) => r.json()),
      ]);
      setTopics(t.topics || []);
      setThreads(th.threads || []);
      setReported(rep.threads || []);
    } catch {
      toast.error("Failed to load community data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/community/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: newKey,
        label: newLabel,
        description: newDesc,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Could not create topic");
      return;
    }
    toast.success("Topic created");
    setNewKey("");
    setNewLabel("");
    setNewDesc("");
    load();
  };

  const toggleTopic = async (topic: Topic) => {
    const res = await fetch(`/api/community/topics/${topic.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !topic.isActive }),
    });
    if (!res.ok) {
      toast.error("Could not update topic");
      return;
    }
    load();
  };

  const patchThread = async (
    id: string,
    patch: { isSticky?: boolean; isLocked?: boolean },
  ) => {
    const res = await fetch(`/api/community/threads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      toast.error("Could not update thread");
      return;
    }
    load();
  };

  const removeThread = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/community/threads/${deleteId}`, {
      method: "DELETE",
    });
    setDeleteId(null);
    if (!res.ok) {
      toast.error("Could not delete");
      return;
    }
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Community</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage topics, moderate threads, and review reports.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Topics</h2>
            <form
              onSubmit={createTopic}
              className="bg-white border border-black/10 rounded-xl p-4 grid sm:grid-cols-4 gap-3"
            >
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="key (e.g. exams)"
                className="border rounded-lg px-3 py-2 text-sm"
                required
              />
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label"
                className="border rounded-lg px-3 py-2 text-sm"
                required
              />
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description"
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold"
              >
                Add topic
              </button>
            </form>
            <ul className="bg-white border border-black/10 rounded-xl divide-y">
              {topics.map((topic) => (
                <li
                  key={topic.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {topic.label}{" "}
                      <span className="text-xs text-gray-400">({topic.key})</span>
                    </p>
                    <p className="text-xs text-gray-500">{topic.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`text-xs font-semibold ${
                      topic.isActive ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {topic.isActive ? "Active" : "Inactive"}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {reported.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-red-700">
                Reported threads ({reported.length})
              </h2>
              <ThreadTable
                threads={reported}
                onSticky={(id, v) => patchThread(id, { isSticky: v })}
                onLock={(id, v) => patchThread(id, { isLocked: v })}
                onDelete={setDeleteId}
              />
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Recent threads</h2>
            <ThreadTable
              threads={threads}
              onSticky={(id, v) => patchThread(id, { isSticky: v })}
              onLock={(id, v) => patchThread(id, { isLocked: v })}
              onDelete={setDeleteId}
            />
          </section>
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete thread?"
        message="This deletes the thread and its replies."
        confirmLabel="Delete"
        onConfirm={removeThread}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function ThreadTable({
  threads,
  onSticky,
  onLock,
  onDelete,
}: {
  threads: Thread[];
  onSticky: (id: string, value: boolean) => void;
  onLock: (id: string, value: boolean) => void;
  onDelete: (id: string) => void;
}) {
  if (threads.length === 0) {
    return <p className="text-sm text-gray-500">None</p>;
  }
  return (
    <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-4 py-3 font-semibold">Thread</th>
            <th className="px-4 py-3 font-semibold">Topic</th>
            <th className="px-4 py-3 font-semibold">Reports</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {threads.map((t) => (
            <tr key={t.id} className="border-t border-gray-100">
              <td className="px-4 py-3">
                <p className="font-medium">{t.title}</p>
                <p className="text-xs text-gray-400">
                  {t.author?.name || "—"} · {t.replyCount || 0} replies
                </p>
              </td>
              <td className="px-4 py-3">{t.topic?.label || "—"}</td>
              <td className="px-4 py-3">{t.reportCount || 0}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onSticky(t.id, !t.isSticky)}
                    className="text-xs font-semibold text-violet-700 hover:underline"
                  >
                    {t.isSticky ? "Unsticky" : "Sticky"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onLock(t.id, !t.isLocked)}
                    className="text-xs font-semibold text-amber-700 hover:underline"
                  >
                    {t.isLocked ? "Unlock" : "Lock"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(t.id)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
