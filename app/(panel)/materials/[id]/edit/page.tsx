import { auth } from "@/lib/auth";
import { adminApi } from "@/lib/express-proxy";
import { redirect, notFound } from "next/navigation";
import { AdminEditMaterialForm } from "@/components/AdminEditMaterialForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Material - Admin - GetMaterials",
};

export default async function AdminEditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    redirect("/login");
  }

  const { id } = await params;

  let data: {
    material: any;
    subjects: any[];
    chapters: any[];
    colleges: any[];
  };
  try {
    data = await adminApi(`/api/admin/materials/${id}/edit-data`);
  } catch (error) {
    console.error("[admin-edit-material] API failed:", error);
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Edit Material</h1>
        <p className="text-slate-500 mt-1">Update material details, files, and status.</p>
      </div>

      <AdminEditMaterialForm
        material={data.material}
        subjects={data.subjects}
        chapters={data.chapters}
        colleges={data.colleges}
      />
    </div>
  );
}
