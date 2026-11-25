import { adminApi } from "@/lib/express-proxy";
import { ApiOfflineBanner } from "@/components/ApiOfflineBanner";
import { UserCheck } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/UserAvatar";

export const dynamic = "force-dynamic";

type FeatureStat = {
  key: string;
  label: string;
  count: number;
  href: string;
};

type TopMaterial = {
  id: string;
  title: string;
  views: number;
  downloads: number;
  status: string;
  thumbnailUrl?: string;
};

type TopQuiz = {
  id: string;
  title: string;
  attempts: number;
  kind?: string;
  thumbnailUrl?: string;
};

type TopPoll = {
  id: string;
  question: string;
  responses: number;
  type?: string;
  thumbnailUrl?: string;
};

function formatCount(value: number) {
  return Number(value || 0).toLocaleString("en-IN");
}

export default async function AdminDashboardPage() {
  let totalUsers = 0;
  let totalMaterials = 0;
  let totalSubjects = 0;
  let pendingTeachers = 0;
  let downloadsTotal = 0;
  let recentUsers: any[] = [];
  let featureInterest: FeatureStat[] = [];
  let topMaterials: TopMaterial[] = [];
  let topQuizzes: TopQuiz[] = [];
  let topPolls: TopPoll[] = [];
  let apiDown = false;
  let apiError = "";

  try {
    const data = await adminApi("/api/admin/dashboard");
    totalUsers = data.totalUsers || 0;
    totalMaterials = data.totalMaterials || 0;
    totalSubjects = data.totalSubjects || 0;
    pendingTeachers = data.pendingTeachers || 0;
    downloadsTotal = data.downloadsTotal || 0;
    recentUsers = data.recentUsers || [];
    featureInterest = data.featureInterest || [];
    topMaterials = data.topMaterials || [];
    topQuizzes = data.topQuizzes || [];
    topPolls = data.topPolls || [];
  } catch (error) {
    apiDown = true;
    apiError = error instanceof Error ? error.message : "";
  }

  const maxFeature = Math.max(1, ...featureInterest.map((item) => item.count || 0));

  const stats = [
    { image: "/images/users.png", label: "Total Users", value: totalUsers, href: "/users" },
    { image: "/images/materials.png", label: "Total Materials", value: totalMaterials, href: "/materials" },
    { image: "/images/subjects.png", label: "Subjects", value: totalSubjects, href: "/subjects" },
    { image: "/images/teacher.png", label: "Pending Teachers", value: pendingTeachers, href: "/teachers" },
    {
      image: "/images/download.png",
      label: "Total Downloads",
      value: downloadsTotal.toLocaleString("en-IN"),
      href: "/materials",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your platform&apos;s performance</p>
        </div>
        {pendingTeachers > 0 && (
          <Link
            href="/teachers"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            {pendingTeachers} pending approval{pendingTeachers > 1 ? "s" : ""}
          </Link>
        )}
      </div>
      {apiDown && <ApiOfflineBanner detail={apiError} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-md hover:border-violet-100 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stat.image} alt="" className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <section className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Feature interest</h2>
            <p className="text-sm text-slate-500 mt-1">
              What students use most across materials, quizzes, polls, and other features.
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {featureInterest.length === 0 ? (
            <p className="text-sm text-slate-500">No engagement data yet.</p>
          ) : (
            featureInterest.map((item) => (
              <Link key={item.key} href={item.href} className="block group">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-800 group-hover:text-violet-700">{item.label}</span>
                  <span className="tabular-nums text-slate-500">{formatCount(item.count)}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all"
                    style={{ width: `${Math.max(4, Math.round((item.count / maxFeature) * 100))}%` }}
                  />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopList
          title="Top viewed materials"
          href="/materials"
          empty="No materials yet."
          items={topMaterials.map((item) => ({
            id: item.id,
            href: `/materials/${item.id}`,
            title: item.title,
            meta: `${formatCount(item.views)} views · ${formatCount(item.downloads)} downloads`,
            image: item.thumbnailUrl || "/images/default-thumbnail.png",
          }))}
        />
        <TopList
          title="Most attempted quizzes"
          href="/quizzes"
          empty="No quiz attempts yet."
          items={topQuizzes.map((item) => ({
            id: item.id,
            href: `/quizzes/${item.id}/edit`,
            title: item.title,
            meta: `${formatCount(item.attempts)} attempts${item.kind ? ` · ${item.kind.replace("_", " ")}` : ""}`,
            image: item.thumbnailUrl || "/images/default-quiz.png",
          }))}
        />
        <TopList
          title="Most answered polls"
          href="/polls"
          empty="No poll responses yet."
          items={topPolls.map((item) => ({
            id: item.id,
            href: "/polls",
            title: item.question,
            meta: `${formatCount(item.responses)} responses${item.type ? ` · ${item.type.replace("_", " ")}` : ""}`,
            image: item.thumbnailUrl || "/images/default-poll.png",
          }))}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Users</h2>
            <Link href="/users" className="text-sm text-violet-600 font-medium hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentUsers.map((user: any) => (
              <div key={String(user._id)} className="px-6 py-3 flex items-center gap-3">
                <UserAvatar name={user.name} image={user.avatar} role={user.role} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                    user.role === "teacher"
                      ? "bg-blue-50 text-blue-700"
                      : user.role === "admin"
                        ? "bg-violet-50 text-violet-700"
                        : "bg-slate-50 text-slate-700"
                  }`}
                >
                  {user.role}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    user.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : user.status === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {user.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Add Subject", href: "/subjects", image: "/images/subjects.png" },
              { label: "Manage Users", href: "/users", image: "/images/users.png" },
              { label: "Review Teachers", href: "/teachers", image: "/images/teacher.png" },
              { label: "All Materials", href: "/materials", image: "/images/materials.png" },
              { label: "Suggestions", href: "/catalog-requests", image: "/images/default-subject.png" },
              { label: "Downloads", href: "/materials", image: "/images/download.png" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50 text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={action.image} alt="" className="w-12 h-12 object-contain shrink-0" />
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopList({
  title,
  href,
  empty,
  items,
}: {
  title: string;
  href: string;
  empty: string;
  items: { id: string; href: string; title: string; meta: string; image: string }[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <Link href={href} className="text-xs font-semibold text-violet-600 hover:underline">
          View all
        </Link>
      </div>
      <div className="divide-y divide-slate-50">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500 text-center">{empty}</p>
        ) : (
          items.slice(0, 10).map((item, index) => (
            <Link key={item.id} href={item.href} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/80">
              <span className="w-5 text-xs font-bold text-slate-400 tabular-nums">{index + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                <p className="text-xs text-slate-500 truncate">{item.meta}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
