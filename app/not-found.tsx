import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-6xl font-extrabold text-slate-900 mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-700 mb-3">Page not found</h2>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          The admin page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2.5 bg-violet-600 text-white font-semibold rounded-lg text-sm hover:bg-violet-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
