"use client";

export default function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto mt-16 rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">This page failed to load</h2>
      <p className="text-sm text-slate-500">
        {error.message || "A server-side exception occurred. Try again or go back to the dashboard."}
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}
