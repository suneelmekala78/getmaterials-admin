import { connectDB, Material } from "@getmaterials/database";
import { FileText, Video, Link2, Eye, Search, Download } from "lucide-react";
import { MaterialActions } from "@/components/MaterialActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Materials - Admin - GetMaterials",
};

export default async function AdminMaterialsPage() {
  await connectDB();

  const materials = await Material.find()
    .populate("subject", "name")
    .populate("uploadedBy", "name email")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
    pdf: { icon: FileText, color: "bg-violet-50 text-violet-600", label: "PDF" },
    video: { icon: Video, color: "bg-blue-50 text-blue-600", label: "Video" },
    link: { icon: Link2, color: "bg-emerald-50 text-emerald-600", label: "Link" },
    image: { icon: FileText, color: "bg-pink-50 text-pink-600", label: "Image" },
  };

  const statusConfig: Record<string, string> = {
    published: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    draft: "bg-slate-100 text-slate-600",
    rejected: "bg-red-50 text-red-700",
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Materials</h1>
          <p className="text-slate-500 mt-1">All uploaded study materials across the platform.</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200">
          <FileText className="w-4 h-4 text-violet-500" />
          <span className="font-medium">{materials.length} total</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search materials..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
        <select className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:border-violet-500">
          <option value="">All Types</option>
          <option value="pdf">PDF</option>
          <option value="video">Video</option>
          <option value="link">Link</option>
        </select>
        <select className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:border-violet-500">
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Materials table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Material</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploaded By</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Views</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {materials.map((material: any) => {
                const typeInfo = typeConfig[material.type] || typeConfig.pdf;
                const TypeIcon = typeInfo.icon;
                return (
                  <tr key={material._id.toString()} className="table-row-hover">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${typeInfo.color} flex items-center justify-center shrink-0`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{material.title}</p>
                          <p className="text-xs text-slate-500 capitalize">{typeInfo.label}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {(material.subject as any)?.name || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {(material.uploadedBy as any)?.name || "Unknown"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-lg capitalize ${statusConfig[material.status] || statusConfig.draft}`}>
                        {material.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        {material.viewCount || 0}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <MaterialActions material={{
                        _id: material._id.toString(),
                        title: material.title,
                        status: material.status,
                        type: material.type,
                      }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {materials.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No materials found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
