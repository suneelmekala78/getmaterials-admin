"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import toast from "react-hot-toast";

interface Material {
  _id: string;
  title: string;
  status: string;
  type: string;
}

export function MaterialActions({ material }: { material: Material }) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/materials/${material._id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleted(true);
        toast.success("Material deleted");
      } else {
        toast.error("Failed to delete material");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (deleted) return <span className="text-xs text-red-500 font-medium">Deleted</span>;

  return (
    <>
      <div className="flex items-center gap-1 justify-end">
        <button
          onClick={() => router.push(`/materials/${material._id}/edit`)}
          className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowDelete(true)}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete Material"
        message={`Are you sure you want to delete "${material.title}"? This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}
