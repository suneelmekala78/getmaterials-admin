"use client";

import { useEffect, useState } from "react";
import { Shield, Plus, Trash2, Save } from "lucide-react";
import toast from "react-hot-toast";

type Config = {
  domains: string[];
  patterns: string[];
  gmailMaxDots: number;
};

export default function DisposableEmailsPage() {
  const [config, setConfig] = useState<Config>({
    domains: [],
    patterns: [],
    gmailMaxDots: 2,
  });
  const [domainInput, setDomainInput] = useState("");
  const [patternInput, setPatternInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/disposable-emails");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setConfig({
        domains: data.domains || [],
        patterns: data.patterns || [],
        gmailMaxDots: typeof data.gmailMaxDots === "number" ? data.gmailMaxDots : 2,
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to load blocklist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const addDomain = () => {
    const value = domainInput.trim().toLowerCase().replace(/^@/, "");
    if (!value) return;
    if (config.domains.includes(value)) {
      toast.error("Domain already listed");
      return;
    }
    setConfig((c) => ({ ...c, domains: [...c.domains, value].sort() }));
    setDomainInput("");
  };

  const addPattern = () => {
    const value = patternInput.trim();
    if (!value) return;
    if (config.patterns.includes(value)) {
      toast.error("Pattern already listed");
      return;
    }
    setConfig((c) => ({ ...c, patterns: [...c.patterns, value] }));
    setPatternInput("");
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/disposable-emails", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setConfig({
        domains: data.domains || [],
        patterns: data.patterns || [],
        gmailMaxDots: data.gmailMaxDots ?? 2,
      });
      toast.success("Blocklist saved");
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading blocklist…</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Email blocklist</h1>
        <p className="text-slate-500 mt-1">
          Block temporary / disposable email domains and formats. Built-in rules still apply;
          entries here are extra admin-controlled blocks.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-violet-600" />
          <h2 className="font-semibold text-slate-900">Gmail dotted aliases</h2>
        </div>
        <p className="text-sm text-slate-500">
          Block Gmail addresses with more than this many dots before @ (e.g.{" "}
          <code className="text-xs bg-slate-50 px-1 rounded">a.b.c@gmail.com</code> has 2 dots).
          Recommended: <strong>2</strong> (blocks 3+ dots).
        </p>
        <label className="block text-sm font-medium text-slate-700">
          Max allowed dots
          <input
            type="number"
            min={0}
            max={10}
            value={config.gmailMaxDots}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                gmailMaxDots: Math.max(0, Math.min(10, Number(e.target.value) || 0)),
              }))
            }
            className="mt-1.5 w-28 px-3 py-2 border border-slate-200 rounded-xl text-sm"
          />
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Blocked domains</h2>
        <p className="text-sm text-slate-500">
          Add domains like <code className="text-xs bg-slate-50 px-1 rounded">easymailer.live</code>{" "}
          (without @).
        </p>
        <div className="flex gap-2">
          <input
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDomain())}
            placeholder="example-temp.com"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
          />
          <button
            type="button"
            onClick={addDomain}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {config.domains.length === 0 ? (
          <p className="text-sm text-slate-400">No custom domains yet.</p>
        ) : (
          <ul className="divide-y divide-slate-50 border border-slate-100 rounded-xl overflow-hidden">
            {config.domains.map((d) => (
              <li
                key={d}
                className="flex items-center justify-between px-3 py-2 text-sm text-slate-700"
              >
                <span>@{d}</span>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      domains: c.domains.filter((x) => x !== d),
                    }))
                  }
                  className="p-1.5 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Blocked formats / patterns</h2>
        <p className="text-sm text-slate-500">
          Plain substring, wildcard (<code className="text-xs">*@tmp.*</code>), or regex (
          <code className="text-xs">/^temp\d+@/i</code>).
        </p>
        <div className="flex gap-2">
          <input
            value={patternInput}
            onChange={(e) => setPatternInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPattern())}
            placeholder="*@mailticking.*"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
          />
          <button
            type="button"
            onClick={addPattern}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {config.patterns.length === 0 ? (
          <p className="text-sm text-slate-400">No custom patterns yet.</p>
        ) : (
          <ul className="divide-y divide-slate-50 border border-slate-100 rounded-xl overflow-hidden">
            {config.patterns.map((p) => (
              <li
                key={p}
                className="flex items-center justify-between px-3 py-2 text-sm text-slate-700 font-mono"
              >
                <span className="truncate">{p}</span>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      patterns: c.patterns.filter((x) => x !== p),
                    }))
                  }
                  className="p-1.5 text-slate-400 hover:text-red-600 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? "Saving…" : "Save blocklist"}
      </button>
    </div>
  );
}
