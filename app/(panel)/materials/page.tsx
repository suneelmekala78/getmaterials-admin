import { adminApi } from "@/lib/express-proxy";
import { FileText } from "lucide-react";
import { AdminMaterialsTable } from "@/components/AdminMaterialsTable";
import { ApiOfflineBanner } from "@/components/ApiOfflineBanner";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Materials - Admin - GetMaterials",
};

export default async function AdminMaterialsPage() {
  let serialized: any[] = [];
  let apiError = "";

  try {
    const { materials } = await adminApi("/api/admin/materials");
    serialized = JSON.parse(JSON.stringify(materials || []));
  } catch (error) {
    apiError = error instanceof Error ? error.message : "API unavailable";
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Materials</h1>
          <p className="text-slate-500 mt-1">
            Assign any uploaded material to one or more colleges, including posts from students and teachers.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200">
          <FileText className="w-4 h-4 text-violet-500" />
          <span className="font-medium">{serialized.length} total</span>
        </div>
      </div>

      {apiError ? <ApiOfflineBanner detail={apiError} /> : null}

      <AdminMaterialsTable materials={serialized} />
    </div>
  );
}
