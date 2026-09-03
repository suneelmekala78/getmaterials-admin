"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-lg w-full rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
        <p className="text-sm text-slate-500">
          {error.message || "A server-side exception occurred while loading this page."}
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
    </div>
  );
}
