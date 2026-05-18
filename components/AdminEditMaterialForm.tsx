"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Video,
  Link2,
  Image,
  ClipboardCheck,
  X,
  CheckCircle,
  Plus,
  Save,
  ArrowLeft,
  Upload,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Subject {
  id: string;
  name: string;
  slug: string;
}

interface Chapter {
  id: string;
  title: string;
  subject: string;
}

interface College {
  id: string;
  name: string;
  code: string;
}

interface AttachmentData {
  type: string;
  fileUrl: string;
  externalUrl: string;
  fileName: string;
}

interface MaterialData {
  id: string;
  title: string;
  description: string;
  type: string;
  materialCategory: string;
  program: string;
  subject: string;
  chapter: string;
  college: string;
  tags: string[];
  thumbnailUrl: string;
  status: string;
  isPublic: boolean;
  attachments: AttachmentData[];
}

interface AdminEditMaterialFormProps {
  material: MaterialData;
  subjects: Subject[];
  chapters: Chapter[];
  colleges: College[];
}

interface AttachmentItem {
  id: string;
  type: "pdf" | "video" | "link" | "image" | "assignment";
  file?: File;
  fileUrl?: string;
  externalUrl?: string;
  fileName?: string;
}

const materialTypes = [
  { value: "pdf", label: "PDF / Notes", icon: FileText, color: "border-red-200 bg-red-50 text-red-700" },
  { value: "video", label: "Video Link", icon: Video, color: "border-blue-200 bg-blue-50 text-blue-700" },
  { value: "link", label: "External Link", icon: Link2, color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { value: "image", label: "Image", icon: Image, color: "border-purple-200 bg-purple-50 text-purple-700" },
  { value: "assignment", label: "Assignment", icon: ClipboardCheck, color: "border-amber-200 bg-amber-50 text-amber-700" },
];

export function AdminEditMaterialForm({ material, subjects, chapters, colleges }: AdminEditMaterialFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: material.title,
    description: material.description,
    subject: material.subject,
    chapter: material.chapter,
    college: material.college,
    tags: material.tags.join(", "),
    materialCategory: material.materialCategory || "notes",
    program: material.program || "btech",
    status: material.status,
    isPublic: material.isPublic,
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>(() => {
    if (material.attachments && material.attachments.length > 0) {
      return material.attachments.map((a) => ({
        id: crypto.randomUUID(),
        type: a.type as AttachmentItem["type"],
        fileUrl: a.fileUrl || undefined,
        externalUrl: a.externalUrl || undefined,
        fileName: a.fileName || undefined,
      }));
    }
    // Fallback for legacy materials with no attachments array
    return [{ id: crypto.randomUUID(), type: (material.type as AttachmentItem["type"]) || "pdf" }];
  });

  const filteredChapters = chapters.filter((c) => c.subject === formData.subject);

  const addAttachment = () => {
    setAttachments([...attachments, { id: crypto.randomUUID(), type: "pdf" }]);
  };

  const removeAttachment = (id: string) => {
    if (attachments.length <= 1) return;
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const updateAttachment = (id: string, updates: Partial<AttachmentItem>) => {
    setAttachments(attachments.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 100 * 1024 * 1024) {
        toast.error("File size must be under 100MB");
        return;
      }
      updateAttachment(id, { file: selected, fileUrl: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload new thumbnail if provided
      let thumbnailUrl = material.thumbnailUrl;
      if (thumbnail) {
        const thumbData = new FormData();
        thumbData.append("file", thumbnail);
        thumbData.append("folder", "thumbnails");
        const thumbRes = await fetch("/api/upload", { method: "POST", body: thumbData });
        if (!thumbRes.ok) throw new Error("Failed to upload thumbnail");
        const { fileUrl } = await thumbRes.json();
        thumbnailUrl = fileUrl;
      }

      // Upload new files for attachments
      const uploadedAttachments = [];
      for (const attachment of attachments) {
        if (attachment.type === "video" || attachment.type === "link") {
          uploadedAttachments.push({
            type: attachment.type,
            externalUrl: attachment.externalUrl || "",
          });
        } else if (attachment.file) {
          const uploadData = new FormData();
          uploadData.append("file", attachment.file);
          uploadData.append("folder", "materials");
          const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadData });
          if (!uploadRes.ok) throw new Error("Failed to upload file");
          const { fileUrl } = await uploadRes.json();
          uploadedAttachments.push({
            type: attachment.type,
            fileUrl,
            fileName: attachment.file.name,
            fileSize: attachment.file.size,
            mimeType: attachment.file.type,
          });
        } else {
          uploadedAttachments.push({
            type: attachment.type,
            fileUrl: attachment.fileUrl || "",
            fileName: attachment.fileName || "",
          });
        }
      }

      const primary = uploadedAttachments[0];

      const res = await fetch(`/api/materials/${material.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          type: primary?.type || material.type,
          materialCategory: formData.materialCategory,
          program: formData.program,
          subject: formData.subject,
          chapter: formData.chapter,
          college: formData.college || undefined,
          status: formData.status,
          isPublic: formData.isPublic,
          thumbnailUrl: thumbnailUrl || undefined,
          attachments: uploadedAttachments,
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update material");
      }

      setSuccess(true);
      toast.success("Material updated successfully!");
      setTimeout(() => router.push("/materials"), 1500);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Material Updated!</h2>
        <p className="text-slate-500">Your changes have been saved.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Link
        href="/materials"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Materials
      </Link>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Material Category *</label>
            <select
              value={formData.materialCategory}
              onChange={(e) => setFormData({ ...formData, materialCategory: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="notes">Notes / Study Material</option>
              <option value="question_paper">Question Paper</option>
              <option value="syllabus">Syllabus</option>
              <option value="assignment">Assignment</option>
              <option value="lab_manual">Lab Manual</option>
              <option value="reference">Reference Material</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Program *</label>
            <select
              value={formData.program}
              onChange={(e) => setFormData({ ...formData, program: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="btech">B.Tech</option>
              <option value="mtech">M.Tech</option>
              <option value="mca">MCA</option>
              <option value="bca">BCA</option>
              <option value="bsc">B.Sc</option>
              <option value="msc">M.Sc</option>
              <option value="mba">MBA</option>
              <option value="bba">BBA</option>
              <option value="diploma">Diploma</option>
              <option value="phd">Ph.D</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
          {formData.description && /<[^>]+>/.test(formData.description) && (
            <div
              className="mb-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm prose prose-sm max-w-none [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-violet-600 [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: formData.description }}
            />
          )}
          <textarea
            value={formData.description.replace(/<[^>]+>/g, "")}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe this material..."
            rows={4}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">Editing will convert to plain text. Rich formatting from teacher uploads is shown above.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject *</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value, chapter: "" })}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Chapter *</label>
            <select
              value={formData.chapter}
              onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
              required
              disabled={!formData.subject}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
            >
              <option value="">Select chapter</option>
              {filteredChapters.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="under_review">Under Review</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Visibility</label>
            <select
              value={formData.isPublic ? "public" : "private"}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.value === "public" })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">College (optional)</label>
          <select
            value={formData.college}
            onChange={(e) => setFormData({ ...formData, college: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="">Not assigned to any college</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Tags (comma-separated)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="e.g., algebra, equations, basics"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
      </div>

      {/* Thumbnail */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <label className="block text-sm font-semibold text-slate-900 mb-3">Thumbnail</label>
        <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-violet-300 transition-colors">
          {thumbnail ? (
            <div className="flex items-center justify-center gap-3">
              <img src={URL.createObjectURL(thumbnail)} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900">{thumbnail.name}</p>
                <p className="text-xs text-slate-500">{(thumbnail.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button type="button" onClick={() => setThumbnail(null)} className="p-1 text-slate-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : material.thumbnailUrl ? (
            <div className="flex items-center justify-center gap-3">
              <img src={material.thumbnailUrl} alt="Current thumbnail" className="w-16 h-16 object-cover rounded-lg" />
              <p className="text-sm text-slate-600">Current thumbnail (upload new to replace)</p>
              <input
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { if (f.size > 5 * 1024 * 1024) { toast.error("Thumbnail must be under 5MB"); return; } setThumbnail(f); }
                }}
                accept=".jpg,.jpeg,.png,.webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          ) : (
            <>
              <Image className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-600 mb-1">Upload a thumbnail image</p>
              <p className="text-xs text-slate-400">JPG, PNG or WebP (max 5MB)</p>
              <input
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { if (f.size > 5 * 1024 * 1024) { toast.error("Thumbnail must be under 5MB"); return; } setThumbnail(f); }
                }}
                accept=".jpg,.jpeg,.png,.webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </>
          )}
        </div>
      </div>

      {/* Attachments */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-semibold text-slate-900">
            Attachments ({attachments.length})
          </label>
          <button type="button" onClick={addAttachment} className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700">
            <Plus className="w-3.5 h-3.5" /> Add more
          </button>
        </div>

        <div className="space-y-4">
          {attachments.map((attachment, index) => (
            <div key={attachment.id} className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">Attachment {index + 1}</span>
                {attachments.length > 1 && (
                  <button type="button" onClick={() => removeAttachment(attachment.id)} className="p-1 text-slate-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Type selector */}
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {materialTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateAttachment(attachment.id, { type: type.value as AttachmentItem["type"], file: undefined, fileUrl: undefined, externalUrl: undefined })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-medium transition-all ${
                      attachment.type === type.value
                        ? type.color + " border-current"
                        : "border-slate-100 text-slate-400 hover:border-slate-200"
                    }`}
                  >
                    <type.icon className="w-3.5 h-3.5" />
                    {type.label}
                  </button>
                ))}
              </div>

              {/* File or URL input */}
              {(attachment.type === "video" || attachment.type === "link") ? (
                <input
                  type="url"
                  value={attachment.externalUrl || ""}
                  onChange={(e) => updateAttachment(attachment.id, { externalUrl: e.target.value })}
                  placeholder={attachment.type === "video" ? "YouTube/Vimeo URL" : "External URL"}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              ) : (
                <div>
                  {attachment.fileUrl && !attachment.file && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-slate-50 rounded-lg">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-600 truncate">{attachment.fileName || "Current file"}</span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-auto">Uploaded</span>
                    </div>
                  )}
                  <div className="relative border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-violet-300 transition-colors">
                    {attachment.file ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4 text-violet-500" />
                        <span className="text-sm text-slate-700">{attachment.file.name}</span>
                        <button type="button" onClick={() => updateAttachment(attachment.id, { file: undefined })} className="p-0.5 text-slate-400 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                        <p className="text-xs text-slate-500">{attachment.fileUrl ? "Upload new file to replace" : "Choose file (max 100MB)"}</p>
                      </>
                    )}
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(attachment.id, e)}
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <Link
          href="/materials"
          className="px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading || !formData.title || !formData.subject || !formData.chapter}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white font-medium text-sm rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
