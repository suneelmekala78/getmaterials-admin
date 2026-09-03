import { adminApi } from "@/lib/express-proxy";
import { ApiOfflineBanner } from "@/components/ApiOfflineBanner";
import {
  Users,
  FileText,
  BookOpen,
  TrendingUp,
  UserCheck,
  Clock,
  Download,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let totalUsers = 0;
  let totalMaterials = 0;
  let totalSubjects = 0;
  let pendingTeachers = 0;
  let downloadsTotal = 0;
  let recentUsers: any[] = [];
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
  } catch (error) {
    apiDown = true;
    apiError = error instanceof Error ? error.message : "";
  }

  const stats = [
    { icon: Users, label: "Total Users", value: totalUsers, color: "text-blue-600 bg-blue-50", href: "/users" },
    { icon: FileText, label: "Total Materials", value: totalMaterials, color: "text-violet-600 bg-violet-50", href: "/materials" },
    { icon: BookOpen, label: "Subjects", value: totalSubjects, color: "text-emerald-600 bg-emerald-50", href: "/subjects" },
    { icon: Clock, label: "Pending Teachers", value: pendingTeachers, color: "text-amber-600 bg-amber-50", href: "/teachers" },
    { icon: Download, label: "Total Downloads", value: downloadsTotal.toLocaleString(), color: "text-cyan-600 bg-cyan-50", href: "/materials" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Overview of your platform&apos;s performance
          </p>
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

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-md hover:border-violet-100 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
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
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                  user.role === "teacher" ? "bg-blue-50 text-blue-700" :
                  user.role === "admin" ? "bg-violet-50 text-violet-700" :
                  "bg-slate-50 text-slate-700"
                }`}>
                  {user.role}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  user.status === "active" ? "bg-emerald-50 text-emerald-700" :
                  user.status === "pending" ? "bg-amber-50 text-amber-700" :
                  "bg-red-50 text-red-700"
                }`}>
                  {user.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Add Subject", href: "/subjects", icon: BookOpen, color: "bg-violet-50 text-violet-600 hover:bg-violet-100" },
              { label: "Manage Users", href: "/users", icon: Users, color: "bg-blue-50 text-blue-600 hover:bg-blue-100" },
              { label: "Review Teachers", href: "/teachers", icon: UserCheck, color: "bg-amber-50 text-amber-600 hover:bg-amber-100" },
              { label: "Add College", href: "/colleges", icon: TrendingUp, color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" },
              { label: "All Materials", href: "/materials", icon: FileText, color: "bg-cyan-50 text-cyan-600 hover:bg-cyan-100" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`flex items-center gap-3 p-4 rounded-xl ${action.color} transition-colors`}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
