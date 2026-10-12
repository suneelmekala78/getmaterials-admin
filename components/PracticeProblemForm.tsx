"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { RichTextEditor } from "@/components/RichTextEditor";

type Lang = "javascript" | "python" | "java" | "cpp";
const LANGS: { id: Lang; label: string }[] = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
];

type CodeSet = Record<Lang, string>;
type Example = { input: string; output: string; explanation: string };
type TestDraft = { input: string; expected: string; hidden: boolean };
type Discussion = { id: string; body: string; authorName: string; createdAt: string };

const emptyCode = (): CodeSet => ({ javascript: "", python: "", java: "", cpp: "" });

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function PracticeProblemForm({ problemId }: { problemId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(problemId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [tags, setTags] = useState("");
  const [functionName, setFunctionName] = useState("solve");
  const [timeLimitMs, setTimeLimitMs] = useState(5000);
  const [isActive, setIsActive] = useState(true);
  const [statement, setStatement] = useState("");
  const [constraints, setConstraints] = useState("");
  const [explanation, setExplanation] = useState("");
  const [examples, setExamples] = useState<Example[]>([{ input: "", output: "", explanation: "" }]);
  const [starterCode, setStarterCode] = useState<CodeSet>(emptyCode());
  const [solutionCode, setSolutionCode] = useState<CodeSet>(emptyCode());
  const [tests, setTests] = useState<TestDraft[]>([
    { input: "[]", expected: "null", hidden: false },
  ]);
  const [slug, setSlug] = useState("");
  const [discussions, setDiscussions] = useState<Discussion[]>([]);

  useEffect(() => {
    if (!problemId) return;
    fetch(`/api/practice/admin/problems/${problemId}`)
      .then((res) => res.json())
      .then(async (data) => {
        const problem = data.problem;
        if (!problem) {
          toast.error("Problem not found");
          return;
        }
        setTitle(problem.title || "");
        setDifficulty(problem.difficulty || "easy");
        setTags((problem.tags || []).join(", "));
        setFunctionName(problem.functionName || "solve");
        setTimeLimitMs(problem.timeLimitMs || 5000);
        setIsActive(problem.isActive !== false);
        setStatement(problem.statement || "");
        setConstraints(problem.constraints || "");
        setExplanation(problem.solutionExplanation || "");
        setExamples(
          problem.examples?.length
            ? problem.examples
            : [{ input: "", output: "", explanation: "" }],
        );
        setStarterCode({ ...emptyCode(), ...problem.starterCode });
        setSolutionCode({ ...emptyCode(), ...problem.solutionCode });
        setTests(
          (problem.tests || []).map((test: { input: unknown; expected: unknown; hidden: boolean }) => ({
            input: pretty(test.input),
            expected: pretty(test.expected),
            hidden: Boolean(test.hidden),
          })),
        );
        setSlug(problem.slug || "");
        if (problem.slug) {
          const discussionRes = await fetch(`/api/practice/problems/${problem.slug}/discussion`);
          const discussionData = await discussionRes.json();
          const posts = discussionData.posts || [];
          const flat: Discussion[] = [];
          for (const post of posts) {
            flat.push(post);
            for (const reply of post.replies || []) flat.push(reply);
          }
          setDiscussions(flat);
        }
      })
      .catch(() => toast.error("Failed to load problem"))
      .finally(() => setLoading(false));
  }, [problemId]);

  const save = async () => {
    let parsedTests;
    try {
      parsedTests = tests.map((test) => ({
        input: JSON.parse(test.input),
        expected: JSON.parse(test.expected),
        hidden: test.hidden,
      }));
    } catch {
      toast.error("Each test input and expected value must be valid JSON");
      return;
    }
    if (!parsedTests.some((test) => !test.hidden)) {
      toast.error("Add at least one sample test");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        difficulty,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        statement,
        constraints,
        examples: examples.filter((example) => example.input || example.output),
        starterCode,
        solutionCode,
        solutionExplanation: explanation,
        functionName,
        tests: parsedTests,
        timeLimitMs: Number(timeLimitMs) || 5000,
        isActive,
      };
      const res = await fetch(isEdit ? `/api/practice/problems/${problemId}` : "/api/practice/problems", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save");
        return;
      }
      toast.success(isEdit ? "Problem updated" : "Problem created");
      router.push("/problems");
    } catch {
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  };

  const removeDiscussion = async (id: string) => {
    const res = await fetch(`/api/practice/discussions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete comment");
      return;
    }
    setDiscussions((prev) => prev.filter((post) => post.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-violet-300 focus:bg-white";

  return (
    <div className="max-w-5xl space-y-5">
      <Link href="/problems" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-violet-700">
        <ArrowLeft size={16} /> Problems
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{isEdit ? "Edit problem" : "New problem"}</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          JavaScript and Python call <span className="font-mono text-slate-700">solve(...args)</span> and return a value. Java uses <span className="font-mono text-slate-700">public static String solve(String argsJson)</span> inside <span className="font-mono text-slate-700">class Solution</span> and returns JSON text. C++ uses <span className="font-mono text-slate-700">std::string solve(const std::string& argsJson)</span>. Do not write main.
        </p>
      </div>

      <section className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm font-semibold text-slate-800">
            Title
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add the pair" />
          </label>
          <label className="block text-sm font-semibold text-slate-800">
            Tags
            <input className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Array, String" />
          </label>
          <label className="block text-sm font-semibold text-slate-800">
            Function name
            <input className={inputClass} value={functionName} onChange={(e) => setFunctionName(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-800">
            Time limit (ms)
            <input type="number" min={1000} max={10000} className={inputClass} value={timeLimitMs} onChange={(e) => setTimeLimitMs(Number(e.target.value))} />
          </label>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-2">Difficulty</p>
          <div className="flex gap-2">
            {(["easy", "medium", "hard"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${
                  difficulty === level
                    ? level === "easy"
                      ? "bg-emerald-600 text-white"
                      : level === "medium"
                        ? "bg-amber-500 text-white"
                        : "bg-rose-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
          Visible to students
          <input type="checkbox" className="h-4 w-4 accent-violet-600" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        </label>
      </section>

      <section className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-2">Statement</p>
          <RichTextEditor content={statement} onChange={setStatement} placeholder="Explain the problem" />
        </div>
        <label className="block text-sm font-semibold text-slate-800">
          Constraints
          <textarea className={`${inputClass} min-h-20`} value={constraints} onChange={(e) => setConstraints(e.target.value)} />
        </label>
      </section>

      <section className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Examples</h2>
          <button type="button" className="text-sm font-semibold text-violet-700 inline-flex items-center gap-1" onClick={() => setExamples((prev) => [...prev, { input: "", output: "", explanation: "" }])}>
            <Plus size={14} /> Add example
          </button>
        </div>
        {examples.map((example, index) => (
          <div key={index} className="grid md:grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <textarea className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Input" value={example.input} onChange={(e) => setExamples((prev) => prev.map((item, i) => i === index ? { ...item, input: e.target.value } : item))} />
            <textarea className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Output" value={example.output} onChange={(e) => setExamples((prev) => prev.map((item, i) => i === index ? { ...item, output: e.target.value } : item))} />
            <textarea className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Explanation" value={example.explanation} onChange={(e) => setExamples((prev) => prev.map((item, i) => i === index ? { ...item, explanation: e.target.value } : item))} />
          </div>
        ))}
      </section>

      <CodeFields title="Starter code" code={starterCode} onChange={setStarterCode} />
      <CodeFields title="Official solution" code={solutionCode} onChange={setSolutionCode} />

      <section className="bg-white border border-slate-100 rounded-2xl p-5">
        <p className="text-sm font-semibold text-slate-800 mb-2">Solution explanation</p>
        <RichTextEditor content={explanation} onChange={setExplanation} placeholder="Explain the approach" />
      </section>

      <section className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Tests</h2>
            <p className="text-sm text-slate-500">Input is a JSON array of arguments. Expected output is any JSON value. At least one test must stay visible as a sample.</p>
          </div>
          <button type="button" className="text-sm font-semibold text-violet-700 inline-flex items-center gap-1 shrink-0" onClick={() => setTests((prev) => [...prev, { input: "[]", expected: "null", hidden: true }])}>
            <Plus size={14} /> Add test
          </button>
        </div>
        {tests.map((test, index) => (
          <div key={index} className="rounded-xl border border-slate-100 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <input type="checkbox" className="accent-violet-600" checked={test.hidden} onChange={(e) => setTests((prev) => prev.map((item, i) => i === index ? { ...item, hidden: e.target.checked } : item))} />
                Hidden from Run
              </label>
              <button type="button" onClick={() => setTests((prev) => prev.filter((_, i) => i !== index))} className="text-rose-600 p-1 rounded-lg hover:bg-rose-50" aria-label="Remove test">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <label className="text-xs font-semibold text-slate-500">
                Input
                <textarea className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono font-normal text-slate-900 min-h-24" value={test.input} onChange={(e) => setTests((prev) => prev.map((item, i) => i === index ? { ...item, input: e.target.value } : item))} />
              </label>
              <label className="text-xs font-semibold text-slate-500">
                Expected
                <textarea className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono font-normal text-slate-900 min-h-24" value={test.expected} onChange={(e) => setTests((prev) => prev.map((item, i) => i === index ? { ...item, expected: e.target.value } : item))} />
              </label>
            </div>
          </div>
        ))}
      </section>

      {isEdit && slug ? (
        <section className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
          <h2 className="font-bold text-slate-900">Discussions</h2>
          {discussions.length === 0 ? <p className="text-sm text-slate-500">No comments yet.</p> : null}
          {discussions.map((post) => (
            <div key={post.id} className="rounded-xl border border-slate-100 px-3 py-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{post.authorName}</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.body}</p>
              </div>
              <button type="button" className="text-rose-600 text-sm font-semibold" onClick={() => removeDiscussion(post.id)}>Delete</button>
            </div>
          ))}
        </section>
      ) : null}

      <button type="button" disabled={saving || !title.trim()} onClick={save} className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold disabled:opacity-50">
        {saving ? "Savingâ€¦" : "Save problem"}
      </button>
    </div>
  );
}

function CodeFields({
  title,
  code,
  onChange,
}: {
  title: string;
  code: CodeSet;
  onChange: (next: CodeSet) => void;
}) {
  const [lang, setLang] = useState<Lang>("javascript");
  return (
    <section className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold text-slate-900">{title}</h2>
        <div className="flex flex-wrap gap-1">
          {LANGS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLang(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${lang === item.id ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <textarea
        className="w-full rounded-xl border border-slate-200 bg-slate-950 text-slate-100 px-3 py-3 font-mono text-xs min-h-48 outline-none"
        value={code[lang]}
        onChange={(e) => onChange({ ...code, [lang]: e.target.value })}
        spellCheck={false}
      />
    </section>
  );
}
