"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineEye } from "react-icons/hi";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import toast from "react-hot-toast";

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  subject?: { _id: string; name: string };
  chapter?: { _id: string; title: string };
  questions: any[];
  duration: number;
  passingScore: number;
  attempts: number;
  isActive: boolean;
  createdAt: string;
}

interface Attempt {
  _id: string;
  user: { name: string; email: string; role: string };
  score: number;
  answers: number[];
  completedAt: string;
}

interface AttemptStats {
  total: number;
  avgScore: number;
  passCount: number;
  failCount: number;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewQuizId, setViewQuizId] = useState<string | null>(null);
  const [viewQuizTitle, setViewQuizTitle] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [attemptStats, setAttemptStats] = useState<AttemptStats | null>(null);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch("/api/quizzes");
      const data = await res.json();
      setQuizzes(data.quizzes || []);
    } catch {
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/quizzes/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setQuizzes((prev) => prev.filter((q) => q._id !== deleteId));
        toast.success("Quiz deleted");
      } else {
        toast.error("Failed to delete quiz");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeleteId(null);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/quizzes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      setQuizzes((prev) =>
        prev.map((q) => (q._id === id ? { ...q, isActive: !isActive } : q))
      );
    } catch {
      toast.error("Failed to update quiz status");
    }
  };

  const viewAttempts = async (quizId: string, title: string) => {
    setViewQuizId(quizId);
    setViewQuizTitle(title);
    setAttemptsLoading(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempts`);
      const data = await res.json();
      if (res.ok) {
        setAttempts(data.attempts || []);
        setAttemptStats(data.stats || null);
      }
    } catch {
      toast.error("Failed to load quiz responses");
    } finally {
      setAttemptsLoading(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quizzes</h1>
          <p className="text-slate-500 text-sm mt-1">{quizzes.length} total quizzes</p>
        </div>
        <Link
          href="/quizzes/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors"
        >
          <HiOutlinePlus className="text-lg" />
          Create Quiz
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <p className="text-slate-500">No quizzes yet. Create your first quiz!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 w-12">#</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">Title</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">Subject</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">Questions</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">Attempts</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-right px-6 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quizzes.map((quiz, index) => (
                <tr key={quiz._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-xs text-slate-400 tabular-nums">{index + 1}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{quiz.title}</p>
                    {quiz.chapter && (
                      <p className="text-xs text-slate-400 mt-0.5">{quiz.chapter.title}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{quiz.subject?.name || "—"}</td>
                  <td className="px-6 py-4 text-slate-600">{quiz.questions?.length || 0}</td>
                  <td className="px-6 py-4 text-slate-600">{quiz.attempts || 0}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(quiz._id, quiz.isActive)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        quiz.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {quiz.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => viewAttempts(quiz._id, quiz.title)}
                        className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                        title="View Responses"
                      >
                        <HiOutlineEye className="text-lg" />
                      </button>
                      <Link
                        href={`/quizzes/${quiz._id}/edit`}
                        className="p-2 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-violet-50"
                      >
                        <HiOutlinePencil className="text-lg" />
                      </Link>
                      <button
                        onClick={() => setDeleteId(quiz._id)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <HiOutlineTrash className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Attempts Modal */}
      {viewQuizId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Quiz Responses</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{viewQuizTitle}</p>
                </div>
                <button
                  onClick={() => { setViewQuizId(null); setAttempts([]); setAttemptStats(null); }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {/* Stats */}
              {attemptStats && attemptStats.total > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-lg font-bold text-slate-900">{attemptStats.total}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Attempts</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-lg font-bold text-slate-900">{attemptStats.avgScore}%</p>
                    <p className="text-[10px] text-slate-500 uppercase">Avg Score</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-xl">
                    <p className="text-lg font-bold text-emerald-700">{attemptStats.passCount}</p>
                    <p className="text-[10px] text-emerald-600 uppercase">Passed</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-xl">
                    <p className="text-lg font-bold text-red-700">{attemptStats.failCount}</p>
                    <p className="text-[10px] text-red-600 uppercase">Failed</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {attemptsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                </div>
              ) : attempts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-500">No one has attempted this quiz yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attempts.map((attempt) => (
                    <div key={attempt._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {attempt.user?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">{attempt.user?.name || "Unknown"}</span>
                          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded capitalize ${
                            attempt.user?.role === "teacher" ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"
                          }`}>
                            {attempt.user?.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{attempt.user?.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${attempt.score >= 60 ? "text-emerald-600" : "text-red-600"}`}>
                          {attempt.score}%
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(attempt.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
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
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
