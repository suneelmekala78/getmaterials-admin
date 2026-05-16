import { connectDB, User } from "@getmaterials/database";
import { UserCheck, UserX, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pending Teachers - Admin - GetMaterials",
};

export default async function PendingTeachersPage() {
  await connectDB();

  const pendingTeachers = await User.find({ role: "teacher", status: "pending" })
    .sort({ createdAt: -1 })
    .lean();

  const approvedTeachers = await User.find({ role: "teacher", status: "active" })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Teacher Management</h1>
        <p className="text-slate-500 mt-1">
          Review and approve teacher applications
        </p>
      </div>

      {/* Pending approvals */}
      <div className="bg-white rounded-2xl border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            Pending Approvals ({pendingTeachers.length})
          </h2>
        </div>

        {pendingTeachers.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {pendingTeachers.map((teacher: any) => (
              <div key={teacher._id.toString()} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-sm font-semibold">
                  {teacher.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{teacher.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {teacher.email}
                  </p>
                  {teacher.qualifications && (
                    <p className="text-xs text-slate-400 mt-0.5">{teacher.qualifications}</p>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(teacher.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <form action={`/api/teachers/${teacher._id}/approve`} method="POST">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Approve
                    </button>
                  </form>
                  <form action={`/api/teachers/${teacher._id}/reject`} method="POST">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" /> Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <UserCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No pending teacher applications</p>
          </div>
        )}
      </div>

      {/* Approved teachers */}
      <div className="bg-white rounded-2xl border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            Approved Teachers ({approvedTeachers.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-50">
          {approvedTeachers.map((teacher: any) => (
            <div key={teacher._id.toString()} className="px-6 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white text-xs font-semibold">
                {teacher.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{teacher.name}</p>
                <p className="text-xs text-slate-500">{teacher.email}</p>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
