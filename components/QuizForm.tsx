"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import ThumbnailPicker from "@/components/ThumbnailPicker";

type QuizKind = "subject" | "general_knowledge" | "other";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const emptyQuestion = (): Question => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  explanation: "",
});

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

export default function QuizForm({ quizId }: { quizId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(quizId);
  const submittingRef = useRef(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<QuizKind>("subject");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [duration, setDuration] = useState(30);
  const [passingScore, setPassingScore] = useState(60);
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(isEdit);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => r.json())
      .then((data) => setSubjects(data.subjects || []));
  }, []);

  useEffect(() => {
    if (!quizId) return;
    fetch(`/api/quizzes/${quizId}`)
      .then((r) => r.json())
      .then((data) => {
        const quiz = data.quiz;
        if (!quiz) {
          setError(data.error || "Quiz not found");
          return;
        }
        setTitle(quiz.title || "");
        setDescription(quiz.description || "");
        setKind(quiz.kind || (quiz.subject ? "subject" : "other"));
        setSubjectId(quiz.subject?._id || quiz.subject || "");
        setChapterId(quiz.chapter?._id || quiz.chapter || "");
        setThumbnailUrl(quiz.thumbnailUrl || "");
        setSlug(quiz.slug || "");
        setDuration(quiz.duration || 30);
        setPassingScore(quiz.passingScore ?? 60);
        setIsActive(quiz.isActive !== false);
        setQuestions(
          (quiz.questions || []).map((q: any) => ({
            question: q.question || "",
            options: q.options?.length ? q.options : ["", "", "", ""],
            correctAnswer: q.correctAnswer ?? 0,
            explanation: q.explanation || "",
          }))
        );
      })
      .catch(() => setError("Failed to load quiz"))
      .finally(() => setLoadingQuiz(false));
  }, [quizId]);

  useEffect(() => {
    if (kind !== "subject" || !subjectId) {
      setChapters([]);
      return;
    }
    fetch(`/api/chapters?subject=${subjectId}`)
      .then((r) => r.json())
      .then((data) => setChapters(data.chapters || []));
  }, [subjectId, kind]);

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (idx: number) => {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) } : q
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent, confirmDuplicate = false) => {
    e.preventDefault();
    if (loading || submittingRef.current) return;
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (kind === "subject" && !subjectId) {
      setError("Subject is required for subject quizzes");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        setError(`Question ${i + 1} text is required`);
        return;
      }
      if (questions[i].options.some((o) => !o.trim())) {
        setError(`All options in Question ${i + 1} are required`);
        return;
      }
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const payload = {
        title,
        description,
        kind,
        subject: kind === "subject" ? subjectId : "",
        chapter: kind === "subject" ? chapterId : "",
        thumbnailUrl,
        questions,
        duration,
        passingScore,
        ...(isEdit ? { isActive } : {}),
        ...(!isEdit && confirmDuplicate ? { confirmDuplicate: true } : {}),
      };
      const res = await fetch(isEdit ? `/api/quizzes/${quizId}` : "/api/quizzes", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (
          !isEdit &&
          res.status === 409 &&
          data.code === "DUPLICATE_TITLE" &&
          !confirmDuplicate
        ) {
          const ok = window.confirm(
            data.error || "A quiz with this title already exists. Create another copy?"
          );
          if (ok) {
            submittingRef.current = false;
            setLoading(false);
            await handleSubmit(e, true);
            return;
          }
          setError(data.error || "Duplicate title");
          toast.error(data.error || "Duplicate title");
          return;
        }
        const msg = data.error || `Failed to ${isEdit ? "update" : "create"} quiz`;
        setError(msg);
        toast.error(msg);
      } else {
        toast.success(isEdit ? "Quiz updated" : "Quiz created");
        router.push("/quizzes");
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  if (loadingQuiz) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isEdit ? "Edit Quiz" : "Create Quiz"}</h1>
          <p className="text-slate-500 text-sm">
            {isEdit
              ? "Update questions, timing, and visibility"
              : "Create subject, GK, or other quizzes for students"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Quiz Details</h2>
            <p className="text-xs text-slate-400">
              <RequiredMark /> required
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title <RequiredMark />
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Chapter 3 - Thermodynamics Quiz"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          {isEdit && slug ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Public URL</label>
              <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 font-mono text-xs text-slate-500">
                /quizzes/{slug}
              </p>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the quiz..."
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Quiz type <RequiredMark />
            </label>
            <select
              value={kind}
              onChange={(e) => {
                const next = e.target.value as QuizKind;
                setKind(next);
                if (next !== "subject") {
                  setSubjectId("");
                  setChapterId("");
                }
              }}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
            >
              <option value="subject">Subject / syllabus quiz</option>
              <option value="general_knowledge">General knowledge</option>
              <option value="other">Other</option>
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Use General knowledge or Other for quizzes that are not tied to a subject chapter.
            </p>
          </div>

          {kind === "subject" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subject <RequiredMark />
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                    setChapterId("");
                  }}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                >
                  <option value="">Select subject</option>
                  {subjects.map((s: any) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Chapter <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <select
                  value={chapterId}
                  onChange={(e) => setChapterId(e.target.value)}
                  disabled={!subjectId}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 disabled:bg-slate-50"
                >
                  <option value="">No specific chapter</option>
                  {chapters.map((c: any) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          <ThumbnailPicker value={thumbnailUrl} onChange={setThumbnailUrl} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Duration (minutes) <RequiredMark />
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Passing Score (%) <RequiredMark />
              </label>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                min={0}
                max={100}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-slate-300 text-violet-600"
              />
              Visible to students
            </label>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              Questions ({questions.length}) <RequiredMark />
            </h2>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">
                  Question {qIdx + 1} <RequiredMark />
                </span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIdx)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <input
                type="text"
                value={q.question}
                onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                placeholder="Enter question..."
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
              />

              <div className="grid grid-cols-2 gap-3">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="relative">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                      required
                      className={`w-full pl-4 pr-10 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-violet-500 ${
                        q.correctAnswer === oIdx ? "border-green-400 bg-green-50" : "border-slate-200"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => updateQuestion(qIdx, "correctAnswer", oIdx)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        q.correctAnswer === oIdx
                          ? "border-green-500 bg-green-500"
                          : "border-slate-300 hover:border-green-400"
                      }`}
                      title="Mark as correct answer"
                    >
                      {q.correctAnswer === oIdx && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <input
                type="text"
                value={q.explanation}
                onChange={(e) => updateQuestion(qIdx, "explanation", e.target.value)}
                placeholder="Explanation (optional) - shown after answering"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition disabled:opacity-50"
        >
          {loading ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save Changes" : "Create Quiz"}
        </button>
      </form>
    </div>
  );
}
