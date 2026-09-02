"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, FileText, Link2, Pencil, Search, Trash2, Video } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AssignCollegesModal, collegeLabels } from "@/components/AssignCollegesModal";
import toast from "react-hot-toast";

type Material = {
  _id: string;
  title: string;
  status: string;
  type: string;
  views?: number;
  subject?: { name?: string };
  uploadedBy?: { name?: string; email?: string };
  college?: { _id?: string; name?: string; code?: string };
  colleges?: { _id?: string; name?: string; code?: string }[];
};

function assignedIds(material: Material) {
  const ids = new Set<string>();
  if (material.college?._id) ids.add(String(material.college._id));
  (material.colleges || []).forEach((item) => {
    if (item?._id) ids.add(String(item._id));
  });
  return Array.from(ids);
}

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  pdf: { icon: FileText, color: "bg-violet-50 text-violet-600", label: "PDF" },
  video: { icon: Video, color: "bg-blue-50 text-blue-600", label: "Video" },
  link: { icon: Link2, color: "bg-emerald-50 text-emerald-600", label: "Link" },
  image: { icon: FileText, color: "bg-pink-50 text-pink-600", label: "Image" },
};

const statusConfig: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700",
  under_review: "bg-amber-50 text-amber-700",
  draft: "bg-slate-100 text-slate-600",
};

export function AdminMaterialsTable({
  materials,
}: {
  materials: Material[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(materials);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [assignFor, setAssignFor] = useState<Material | "bulk" | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setRows(materials);
  }, [materials]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((material) => {
      const colleges = collegeLabels(material).join(" ");
      return `${material.title} ${material.uploadedBy?.name || ""} ${material.subject?.name || ""} ${colleges}`
        .toLowerCase()
        .includes(q);
    });
  }, [rows, query]);

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? visible.map((item) => String(item._id)) : []);
  };

  const toggleOne = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const refreshAssigned = (materialId: string, collegeIds: string[], colleges: any[]) => {
    const picked = colleges.filter((college) =>
      collegeIds.includes(String(college._id || college.id))
    );
    setRows((current) =>
      current.map((item) =>
        String(item._id) === materialId
          ? { ...item, colleges: picked, college: picked[0] }
          : item
      )
    );
  };

  const saveSingle = async (collegeIds: string[]) => {
    if (!assignFor || assignFor === "bulk") return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/materials/${assignFor._id}/colleges`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeIds }),
      });
      if (!res.ok) throw new Error("Failed to assign colleges");
      const collegesRes = await fetch("/api/colleges");
      const data = await collegesRes.json();
      refreshAssigned(String(assignFor._id), collegeIds, data.colleges || []);
      toast.success("Colleges updated");
      setAssignFor(null);
      router.refresh();
    } catch {
      toast.error("Could not assign colleges");
    } finally {
      setSaving(false);
    }
  };

  const saveBulk = async (collegeIds: string[]) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/materials/assign-colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialIds: selected, collegeIds, mode: "add" }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Assigned to ${selected.length} materials`);
      setAssignFor(null);
      setSelected([]);
      router.refresh();
    } catch {
      toast.error("Could not assign colleges");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/materials/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setRows((current) => current.filter((item) => String(item._id) !== deleteId));
      toast.success("Material deleted");
    } catch {
      toast.error("Failed to delete material");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const initialIds =
    assignFor && assignFor !== "bulk" ? assignedIds(assignFor) : [];

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search materials, uploader, college..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => setAssignFor("bulk")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold"
          >
            <Building2 className="w-4 h-4" />
            Assign to colleges ({selected.length})
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={visible.length > 0 && selected.length === visible.length}
                    onChange={(event) => toggleAll(event.target.checked)}
                  />
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Material</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploaded By</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Colleges</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visible.map((material) => {
                const typeInfo = typeConfig[material.type] || typeConfig.pdf;
                const TypeIcon = typeInfo.icon;
                const labels = collegeLabels(material);
                const id = String(material._id);
                return (
                  <tr key={id} className="table-row-hover">
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selected.includes(id)} onChange={() => toggleOne(id)} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${typeInfo.color} flex items-center justify-center shrink-0`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate max-w-[220px]">{material.title}</p>
                          <p className="text-xs text-slate-500 capitalize">{typeInfo.label}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{material.subject?.name || "—"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {material.uploadedBy?.name || "Unknown"}
                    </td>
                    <td className="px-5 py-4">
                      {labels.length === 0 ? (
                        <span className="text-xs text-slate-400">Unassigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {labels.slice(0, 2).map((label) => (
                            <span key={label} className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[11px] font-medium">
                              {label}
                            </span>
                          ))}
                          {labels.length > 2 && (
                            <span className="text-[11px] text-slate-400">+{labels.length - 2}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-lg capitalize ${statusConfig[material.status] || statusConfig.draft}`}>
                        {material.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => setAssignFor(material)}
                          className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                          title="Assign colleges"
                        >
                          <Building2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/materials/${id}/edit`)}
                          className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && (
          <div className="p-12 text-center text-sm text-slate-500">No materials found.</div>
        )}
      </div>

      <AssignCollegesModal
        open={assignFor !== null}
        title={assignFor === "bulk" ? `${selected.length} selected materials` : assignFor?.title || ""}
        initialIds={initialIds}
        saving={saving}
        onClose={() => setAssignFor(null)}
        onSave={assignFor === "bulk" ? saveBulk : saveSingle}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Material"
        message="Are you sure you want to delete this material? This action cannot be undone."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
