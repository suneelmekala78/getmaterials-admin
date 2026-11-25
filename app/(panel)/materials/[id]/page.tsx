import Link from "next/link";
import { auth } from "@/lib/auth";
import { adminApi } from "@/lib/express-proxy";
import { redirect, notFound } from "next/navigation";
import { UserAvatar } from "@/components/UserAvatar";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Pencil,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "View Material - Admin - GetMaterials",
};

const statusClass: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700",
  under_review: "bg-amber-50 text-amber-700",
  draft: "bg-slate-100 text-slate-600",
};

function when(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminViewMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    redirect("/login");
  }

  const { id } = await params;
  let material: any;
  try {
    const data = await adminApi(`/api/admin/materials/${id}`);
    material = data.material;
  } catch {
    notFound();
  }

  if (!material) notFound();

  const colleges = [
    ...(material.college ? [material.college] : []),
    ...((material.colleges || []).filter(
      (c: any) => !material.college || c.id !== material.college.id,
    ) as any[]),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/materials"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            All materials
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${
                statusClass[material.status] || statusClass.draft
              }`}
            >
              {String(material.status || "draft").replace("_", " ")}
            </span>
            <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold uppercase text-violet-700">
              {material.type}
            </span>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {String(material.materialCategory || "notes").replace("_", " ")}
            </span>
            {!material.isPublic ? (
              <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                Private
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{material.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Admin preview — drafts and under-review items are visible here even when hidden on the site.
          </p>
        </div>
        <Link
          href={`/materials/${material.id}/edit`}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
        >
          <Pencil className="w-4 h-4" />
          Edit
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Eye, label: "Views", value: material.views ?? 0 },
          { icon: Download, label: "Downloads", value: material.downloads ?? 0 },
          {
            icon: FileText,
            label: "Rating",
            value: `${Number(material.rating?.average || 0).toFixed(1)} (${material.rating?.count || 0})`,
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Description</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {material.description || "No description."}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Attachments ({material.attachments?.length || 0})
            </h2>
            <div className="mt-3 space-y-2">
              {(material.attachments || []).length === 0 ? (
                <p className="text-sm text-slate-500">No files or links attached.</p>
              ) : (
                (material.attachments || []).map((item: any, index: number) => {
                  const href = item.fileUrl || item.externalUrl;
                  return (
                    <div
                      key={`${item.fileName || item.type}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {item.fileName || item.externalUrl || `${item.type} resource`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {[item.type, fileSize(item.fileSize), item.mimeType].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                        >
                          Open
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={material.thumbnailUrl || "/images/default-thumbnail.png"}
              alt=""
              className="h-44 w-full object-cover bg-slate-100"
            />
            <div className="space-y-3 p-5 text-sm">
              <Meta label="Subject" value={material.subject?.name || "—"} />
              <Meta label="Chapter" value={material.chapter?.title || "—"} />
              <Meta label="Program" value={material.program || "—"} />
              <Meta
                label="Branch / section"
                value={[material.branch, material.section].filter(Boolean).join(" · ") || "—"}
              />
              <Meta label="Semester" value={material.semester || "—"} />
              <Meta label="Batch" value={material.batch || "—"} />
              <Meta label="Slug" value={material.slug || "—"} />
              <Meta label="Created" value={when(material.createdAt)} />
              <Meta label="Updated" value={when(material.updatedAt)} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Uploader</h2>
            {material.uploadedBy ? (
              <div className="mt-3 flex items-center gap-3">
                <UserAvatar
                  name={material.uploadedBy.name}
                  image={material.uploadedBy.avatar}
                  role={material.uploadedBy.role}
                  size={40}
                />
                <div className="min-w-0">
                  <Link
                    href={`/users/${material.uploadedBy.id}`}
                    className="block truncate text-sm font-medium text-slate-900 hover:text-violet-700"
                  >
                    {material.uploadedBy.name}
                  </Link>
                  <p className="truncate text-xs text-slate-500">
                    {[material.uploadedBy.email, material.uploadedBy.role].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Unknown uploader</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Colleges</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {colleges.length === 0 ? (
                <span className="text-sm text-slate-500">Unassigned</span>
              ) : (
                colleges.map((college: any) => (
                  <span
                    key={college.id}
                    className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700"
                  >
                    {college.name}
                    {college.code ? ` (${college.code})` : ""}
                  </span>
                ))
              )}
            </div>
            {(material.tags || []).length > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tags</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {material.tags.map((tag: string) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-800 break-all">{value}</span>
    </div>
  );
}
