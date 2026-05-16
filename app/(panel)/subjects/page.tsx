import { connectDB, Subject } from "@getmaterials/database";
import { BookOpen, Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Subjects - Admin - GetMaterials",
};

export default async function SubjectsAdminPage() {
  await connectDB();
  const subjects = await Subject.find().sort({ name: 1 }).lean();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subjects</h1>
          <p className="text-slate-500 mt-1">
            Manage subjects and their categories
          </p>
        </div>
        <Link
          href="/subjects/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold rounded-xl text-sm hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Add Subject
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3 font-medium text-slate-500">Subject</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Category</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Materials</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Status</th>
                <th className="text-right px-6 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {subjects.map((subject: any) => (
                <tr key={subject._id.toString()} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{subject.name}</p>
                        <p className="text-xs text-slate-400">{subject.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-slate-600">{subject.category}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {subject.materialsCount || 0}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      subject.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}>
                      {subject.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {subjects.length === 0 && (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No subjects yet. Add your first subject.</p>
          </div>
        )}
      </div>
    </div>
  );
}
