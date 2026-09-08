"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  CloudUpload,
  FileText,
  Globe,
  GripVertical,
  Image as ImageIcon,
  Link2,
  Lock,
  Pencil,
  Plus,
  Rocket,
  Search,
  Shield,
  Check,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { uploadBrowserFile } from "@/lib/upload-file";
import { mergeTags, normalizeTags } from "@/lib/tags";
import { RichTextEditor } from "@/components/RichTextEditor";
import toast from "react-hot-toast";

const DEFAULT_BRANCH_OPTIONS = [
  "CSE",
  "CSD",
  "IT",
  "AI",
  "AIML",
  "AIDS",
  "ECE",
  "EEE",
  "ME",
  "CE",
  "Others",
] as const;

function parseBranchList(value?: string | string[] | null): string[] {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(value.map((item) => String(item || "").trim().toUpperCase()).filter(Boolean)),
    );
  }
  if (!value) return [];
  return Array.from(
    new Set(
      String(value)
        .split(/[,|/]+/)
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean),
    ),
  );
}

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
  programs: { key: string; label: string; durationYears: number; totalSemesters: number }[];
  branches: { program: string; name: string; sections: string[] }[];
}

export type InitialMaterial = {
  id: string;
  title: string;
  description?: string;
  subject: string;
  chapter?: string;
  college?: string;
  collegeIds?: string[];
  colleges?: string[];
  branch?: string;
  section?: string;
  semester?: string | number;
  materialCategory?: string;
  program?: string;
  batch?: string;
  isPublic?: boolean;
  tags?: unknown;
  thumbnailUrl?: string;
  status?: string;
  attachments?: {
    type: string;
    fileUrl?: string;
    externalUrl?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
  }[];
};

interface UploadFormProps {
  subjects: Subject[];
  chapters: Chapter[];
  colleges: College[];
  assignedColleges?: string[];
  userRole?: string;
  successRedirect?: string;
  initialMaterial?: InitialMaterial;
}

type AttachmentType = "pdf" | "video" | "link" | "image" | "assignment";

interface AttachmentItem {
  id: string;
  type: AttachmentType;
  file?: File;
  fileUrl?: string;
  fileName?: string;
  externalUrl?: string;
  previewUrl?: string;
}

const TITLE_MAX = 200;
const DESC_MAX = 3000;
const TAG_MAX = 10;
const FILE_MAX_MB = 100;

const programs = [
  { key: "btech", label: "B.Tech" },
  { key: "mtech", label: "M.Tech" },
  { key: "mca", label: "MCA" },
  { key: "bca", label: "BCA" },
  { key: "bsc", label: "B.Sc" },
  { key: "msc", label: "M.Sc" },
  { key: "mba", label: "MBA" },
  { key: "bba", label: "BBA" },
  { key: "diploma", label: "Diploma" },
  { key: "phd", label: "Ph.D" },
  { key: "other", label: "Other" },
];

const materialTypes: { value: AttachmentType; label: string; icon: typeof FileText; color: string }[] = [
  { value: "pdf", label: "PDF", icon: FileText, color: "bg-red-50 text-red-600" },
  { value: "video", label: "Video", icon: Video, color: "bg-blue-50 text-blue-600" },
  { value: "link", label: "Link", icon: Link2, color: "bg-emerald-50 text-emerald-600" },
  { value: "image", label: "Image", icon: ImageIcon, color: "bg-purple-50 text-purple-600" },
  { value: "assignment", label: "Document", icon: FileText, color: "bg-amber-50 text-amber-600" },
];

function typeFromFile(file: File): AttachmentType {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "assignment";
}

function youtubeId(url?: string) {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return match?.[1] || null;
}

function plainLength(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim().length;
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function attachmentFileUrl(attachment: {
  fileUrl?: string | null;
  url?: string | null;
  file?: unknown;
}) {
  if (typeof attachment.fileUrl === "string" && attachment.fileUrl.trim()) return attachment.fileUrl.trim();
  if (typeof attachment.url === "string" && attachment.url.trim()) return attachment.url.trim();
  if (typeof attachment.file === "string" && attachment.file.trim()) return attachment.file.trim();
  return "";
}

function hasAttachmentContent(item: AttachmentItem, storedFile?: File) {
  const file = storedFile || item.file;
  if (file) return true;
  if ((item.externalUrl || "").trim()) return true;
  if (attachmentFileUrl(item)) return true;
  if ((item.previewUrl || "").startsWith("blob:")) return true;
  return Boolean((item.fileName || "").trim());
}

export function MaterialForm({
  subjects: initialSubjects,
  chapters: initialChapters,
  colleges,
  assignedColleges = [],
  userRole,
  successRedirect,
  initialMaterial,
}: UploadFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialMaterial?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<"draft" | "publish" | null>(null);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [chapters, setChapters] = useState(initialChapters);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editorKey, setEditorKey] = useState(0);
  const [formData, setFormData] = useState({
    title: initialMaterial?.title || "",
    description: initialMaterial?.description || "",
    subject: initialMaterial?.subject || "",
    chapter: initialMaterial?.chapter || "",
    college: initialMaterial?.college || "",
    collegeIds: initialMaterial?.collegeIds?.length
      ? initialMaterial.collegeIds
      : initialMaterial?.colleges?.length
        ? initialMaterial.colleges
        : initialMaterial?.college
          ? [initialMaterial.college]
          : ([] as string[]),
    branches: parseBranchList(initialMaterial?.branch),
    section: initialMaterial?.section || "",
    semester: initialMaterial?.semester != null && initialMaterial.semester !== "" ? String(initialMaterial.semester) : "",
    materialCategory: initialMaterial?.materialCategory || "notes",
    program: initialMaterial?.program || "",
    batch: initialMaterial?.batch || "",
    isPublic: initialMaterial?.isPublic !== false,
    status: initialMaterial?.status || "published",
  });
  const [tags, setTags] = useState<string[]>(() => normalizeTags(initialMaterial?.tags));
  const [tagDraft, setTagDraft] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>(() =>
    (initialMaterial?.attachments || []).map((attachment) => ({
      id: crypto.randomUUID(),
      type: (attachment.type as AttachmentType) || "pdf",
      fileUrl: attachmentFileUrl(attachment) || undefined,
      fileName: attachment.fileName || undefined,
      externalUrl: attachment.externalUrl || undefined,
      previewUrl: attachmentFileUrl(attachment) || undefined,
    }))
  );
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(initialMaterial?.thumbnailUrl || "");
  const [keepThumbnailUrl, setKeepThumbnailUrl] = useState(initialMaterial?.thumbnailUrl || "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [collegeQuery, setCollegeQuery] = useState("");
  const [collegeOpen, setCollegeOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const filesRef = useRef<Map<string, File>>(new Map());

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCategory, setNewSubjectCategory] = useState("engineering");
  const [addingSubject, setAddingSubject] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [addingChapter, setAddingChapter] = useState(false);

  useEffect(() => {
    if (!initialMaterial) return;
    setTags(normalizeTags(initialMaterial.tags));
    setThumbnailPreview(initialMaterial.thumbnailUrl || "");
    setKeepThumbnailUrl(initialMaterial.thumbnailUrl || "");
  }, [initialMaterial?.id, initialMaterial?.thumbnailUrl]);

  const filteredChapters = chapters.filter((c) => c.subject === formData.subject);
  const selectedColleges = colleges.filter((c) => formData.collegeIds.includes(c.id));
  const selectedCollege = selectedColleges[0];
  const availableColleges =
    userRole === "teacher" && assignedColleges.length > 0
      ? colleges.filter((c) => assignedColleges.includes(c.id))
      : colleges;
  const collegeResults = availableColleges.filter((college) => {
    const q = collegeQuery.trim().toLowerCase();
    if (!q) return true;
    return college.name.toLowerCase().includes(q) || String(college.code || "").toLowerCase().includes(q);
  });

  const descLength = plainLength(formData.description);
  const canCreateCatalog = Boolean(userRole);
  const needsChapter = false;

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const addTag = (value: string) => {
    const incoming = normalizeTags(value);
    if (!incoming.length) return;
    const next = mergeTags(tags, value);
    const unused = incoming.filter((tag) => !tags.includes(tag)).length;
    if (next.length < tags.length + unused) {
      toast.error("Maximum 10 tags");
    }
    setTags(next);
    setTagDraft("");
  };

  const addFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    const next = [...attachments];
    for (const file of incoming) {
      if (next.length >= 10) {
        toast.error("Maximum 10 resources");
        break;
      }
      if (file.size > FILE_MAX_MB * 1024 * 1024) {
        toast.error(`${file.name} is over ${FILE_MAX_MB}MB`);
        continue;
      }
      const type = typeFromFile(file);
      const item: AttachmentItem = {
        id: crypto.randomUUID(),
        type,
        file,
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
      };
      filesRef.current.set(item.id, file);
      next.push(item);
      setPreviewId((current) => current || item.id);
    }
    setAttachments(next);
    clearFieldError("attachments");
  };

  const addEmptyResource = (type: AttachmentType) => {
    if (attachments.length >= 10) {
      toast.error("Maximum 10 resources");
      return;
    }
    const item: AttachmentItem = { id: crypto.randomUUID(), type };
    setAttachments([...attachments, item]);
    setEditingId(item.id);
  };

  const removeAttachment = (id: string) => {
    filesRef.current.delete(id);
    setAttachments(attachments.filter((item) => item.id !== id));
    if (editingId === id) setEditingId(null);
    if (previewId === id) setPreviewId(attachments.find((item) => item.id !== id)?.id || null);
  };

  const updateAttachment = (id: string, updates: Partial<AttachmentItem>) => {
    setAttachments(attachments.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const moveAttachment = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= attachments.length) return;
    const next = [...attachments];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);
    setAttachments(next);
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      toast.error("Please enter a subject name");
      return;
    }
    setAddingSubject(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSubjectName.trim(), category: newSubjectCategory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add subject");
      const newSubject = { id: data.subject._id.toString(), name: data.subject.name, slug: data.subject.slug };
      setSubjects([...subjects, newSubject].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData({ ...formData, subject: newSubject.id, chapter: "" });
      setNewSubjectName("");
      setShowAddSubject(false);
      clearFieldError("subject");
      toast.success(`Subject "${newSubject.name}" added!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingSubject(false);
    }
  };

  const handleAddChapter = async () => {
    if (!formData.subject) {
      toast.error("Please select a subject first");
      setFieldErrors((prev) => ({ ...prev, subject: "Select a subject before adding a chapter" }));
      return;
    }
    if (!newChapterTitle.trim()) {
      toast.error("Please enter a chapter title");
      return;
    }
    setAddingChapter(true);
    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newChapterTitle.trim(), subject: formData.subject }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add chapter");
      const newChapter = { id: data.chapter._id.toString(), title: data.chapter.title, subject: formData.subject };
      setChapters([...chapters, newChapter]);
      setFormData({ ...formData, chapter: newChapter.id });
      setNewChapterTitle("");
      setShowAddChapter(false);
      clearFieldError("chapter");
      toast.success(`Chapter "${newChapter.title}" added!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingChapter(false);
    }
  };

  const handleSubmit = async (asDraft: boolean) => {
    setFieldErrors({});
    setLoading(true);

    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.subject) errors.subject = "Please select a subject";
    if (needsChapter && !formData.chapter) errors.chapter = "Please select a chapter";
    if (!formData.isPublic && formData.collegeIds.length === 0) errors.college = "Select a college for college-only materials";
    const ready = attachments.filter((item) => hasAttachmentContent(item, filesRef.current.get(item.id)));
    if (ready.length === 0) errors.attachments = "Add at least one file or URL";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      toast.error(errors[Object.keys(errors)[0]]);
      const el = document.getElementById(`field-${Object.keys(errors)[0]}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const resolvedTags = mergeTags(tags, tagDraft);
    setTagDraft("");
    if (resolvedTags.length !== tags.length) setTags(resolvedTags);

    try {
      toast.loading(asDraft ? "Saving draft..." : isEdit ? "Saving changes..." : "Uploading material...", { id: "upload" });

      const uploadedAttachments = [];
      for (const attachment of attachments) {
        const pickedFile = attachment.file || filesRef.current.get(attachment.id);
        const existingUrl =
          attachmentFileUrl(attachment) ||
          attachmentFileUrl(
            initialMaterial?.attachments?.find((item) => item.fileName && item.fileName === attachment.fileName) || {}
          );
        if ((attachment.type === "video" || attachment.type === "link") && attachment.externalUrl && !pickedFile) {
          uploadedAttachments.push({
            type: attachment.type,
            externalUrl: attachment.externalUrl,
          });
          continue;
        }
        if (pickedFile) {
          const { fileUrl } = await uploadBrowserFile(pickedFile, "materials");
          uploadedAttachments.push({
            type: attachment.type,
            fileUrl,
            externalUrl: attachment.externalUrl,
            fileName: pickedFile.name,
            fileSize: pickedFile.size,
            mimeType: pickedFile.type || "application/octet-stream",
          });
          continue;
        }
        if (existingUrl) {
          uploadedAttachments.push({
            type: attachment.type,
            fileUrl: existingUrl,
            fileName: attachment.fileName || "",
            externalUrl: attachment.externalUrl,
          });
        }
      }
      if (uploadedAttachments.length === 0) {
        throw new Error("Add at least one file or URL");
      }

      let thumbnailUrl: string | undefined = keepThumbnailUrl || undefined;
      if (thumbnail) {
        const { fileUrl } = await uploadBrowserFile(thumbnail, "thumbnails");
        thumbnailUrl = fileUrl;
      }

      const primary = uploadedAttachments[0];
      const payload = {
        title: formData.title.trim(),
        description: formData.description,
        type: primary?.type || "pdf",
        materialCategory: formData.materialCategory,
        program: formData.program || undefined,
        branch: formData.branches.length ? formData.branches.join(",") : undefined,
        branches: formData.branches.length ? formData.branches : undefined,
        section: formData.section || undefined,
        semester: formData.semester ? parseInt(formData.semester, 10) : undefined,
        subject: formData.subject,
        chapter: formData.chapter || undefined,
        college: formData.collegeIds[0] || undefined,
        colleges: formData.collegeIds,
        batch: formData.batch || undefined,
        tags: resolvedTags,
        thumbnailUrl,
        status: asDraft ? "draft" : userRole === "admin" ? formData.status : isEdit ? formData.status : undefined,
      };
      const res = await fetch(isEdit ? `/api/materials/${initialMaterial!.id}` : "/api/materials", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload material");
      }

      toast.success(
        asDraft ? "Draft saved" : isEdit ? "Material updated successfully!" : "Material uploaded successfully!",
        { id: "upload" }
      );
      setSuccess(asDraft ? "draft" : "publish");
    } catch (err: any) {
      const raw = String(err?.message || "");
      toast.error(
        raw === "Failed to fetch"
          ? "Upload could not reach storage. Check the API is running and try again."
          : raw || "Something went wrong",
        { id: "upload" }
      );
    } finally {
      setLoading(false);
    }
  };

  const collegePrograms = selectedCollege?.programs || [];
  const collegeBranches = (selectedCollege?.branches || []).filter((b) => b.program === formData.program);
  const branchOptions = Array.from(
    new Set([
      ...DEFAULT_BRANCH_OPTIONS,
      ...collegeBranches.map((b) => String(b.name || "").trim().toUpperCase()).filter(Boolean),
    ]),
  );
  const selectedBranch = collegeBranches.find((b) =>
    formData.branches.some((name) => name === String(b.name || "").trim().toUpperCase()),
  );
  const branchSections = selectedBranch?.sections || [];
  const maxSemesters = collegePrograms.find((p) => p.key === formData.program)?.totalSemesters || 10;

  const toggleBranch = (name: string) => {
    const code = name.trim().toUpperCase();
    if (!code) return;
    setFormData((prev) => {
      const exists = prev.branches.includes(code);
      const branches = exists ? prev.branches.filter((b) => b !== code) : [...prev.branches, code];
      return { ...prev, branches };
    });
  };

  const previewItem = useMemo(
    () => attachments.find((item) => item.id === previewId) || attachments[0],
    [attachments, previewId]
  );

  const materialsHref =
    successRedirect ||
    (userRole === "admin" ? "/materials" : userRole === "teacher" ? "/teacher/materials" : "/my-materials");

  const resetForNewUpload = () => {
    filesRef.current.clear();
    setSuccess(null);
    setFieldErrors({});
    setEditorKey((key) => key + 1);
    setFormData({
      title: "",
      description: "",
      subject: "",
      chapter: "",
      college: "",
      collegeIds: [],
      branches: [],
      section: "",
      semester: "",
      materialCategory: "notes",
      program: "",
      batch: "",
      isPublic: true,
      status: "published",
    });
    setTags([]);
    setTagDraft("");
    setAttachments([]);
    setThumbnail(null);
    setThumbnailPreview("");
    setKeepThumbnailUrl("");
    setEditingId(null);
    setPreviewId(null);
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {success === "draft" ? "Draft saved" : isEdit ? "Material updated!" : "Material uploaded!"}
        </h2>
        <p className="text-slate-500 mb-8">
          {success === "draft"
            ? "You can come back later to finish and publish."
            : isEdit
              ? "Your changes have been saved."
              : userRole === "student"
                ? "Your upload is in review and will go live after approval."
                : "Your material is now available to students."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!isEdit && (
            <button
              type="button"
              onClick={resetForNewUpload}
              className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm hover:opacity-90"
            >
              Upload another material
            </button>
          )}
          {isEdit && (
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50"
            >
              Keep editing
            </button>
          )}
          <Link
            href={materialsHref}
            className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50"
          >
            Go to materials
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit(false);
      }}
      className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start"
    >
      <section className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <h2 className="text-lg font-bold text-slate-900">1. Basic Information</h2>

        <div id="field-title">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            maxLength={TITLE_MAX}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              clearFieldError("title");
            }}
            placeholder="Enter a descriptive title"
            className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
              fieldErrors.title
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-200 focus:border-violet-500 focus:ring-violet-500/20"
            }`}
          />
          <div className="flex justify-between mt-1">
            {fieldErrors.title ? (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {fieldErrors.title}
              </p>
            ) : (
              <span />
            )}
            <p className="text-xs text-slate-400">
              {formData.title.length}/{TITLE_MAX}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div id="field-subject">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">
                Subject <span className="text-red-500">*</span>
              </label>
              {canCreateCatalog && (
                <button type="button" onClick={() => setShowAddSubject(!showAddSubject)} className="text-xs font-medium text-violet-600">
                  <Plus className="w-3 h-3 inline" /> Add New
                </button>
              )}
            </div>
            {showAddSubject && (
              <div className="mb-2 p-3 bg-violet-50 border border-violet-200 rounded-xl space-y-2">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Subject name"
                  className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm"
                />
                <select
                  value={newSubjectCategory}
                  onChange={(e) => setNewSubjectCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm"
                >
                  <option value="engineering">Engineering</option>
                  <option value="science">Science</option>
                  <option value="arts">Arts</option>
                  <option value="commerce">Commerce</option>
                  <option value="medical">Medical</option>
                  <option value="law">Law</option>
                  <option value="general">General</option>
                </select>
                <div className="flex gap-2">
                  <button type="button" onClick={handleAddSubject} disabled={addingSubject} className="px-3 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                    {addingSubject ? "Adding..." : "Add Subject"}
                  </button>
                  <button type="button" onClick={() => setShowAddSubject(false)} className="text-xs text-slate-500">
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <select
              value={formData.subject}
              onChange={(e) => {
                setFormData({ ...formData, subject: e.target.value, chapter: "" });
                clearFieldError("subject");
              }}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
                fieldErrors.subject ? "border-red-300" : "border-slate-200"
              }`}
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {fieldErrors.subject && <p className="mt-1 text-xs text-red-600">{fieldErrors.subject}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Category
              <span className="text-slate-400 font-normal"> (notes, paper, syllabus…)</span>
            </label>
            <select
              value={formData.materialCategory}
              onChange={(e) => setFormData({ ...formData, materialCategory: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
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
        </div>

        <div id="field-chapter">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700">
              Chapter <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            {canCreateCatalog && formData.subject ? (
              <button type="button" onClick={() => setShowAddChapter(!showAddChapter)} className="text-xs font-medium text-violet-600">
                <Plus className="w-3 h-3 inline" /> Add New
              </button>
            ) : (
              <span className="text-xs text-slate-400">{formData.subject ? "Goes under General if empty" : "Select subject first"}</span>
            )}
          </div>
          {showAddChapter && (
            <div className="mb-2 p-3 bg-violet-50 border border-violet-200 rounded-xl space-y-2">
              <input
                type="text"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="Chapter title"
                disabled={!formData.subject}
                className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm disabled:opacity-50"
              />
              <div className="flex gap-2">
                <button type="button" onClick={handleAddChapter} disabled={addingChapter || !formData.subject} className="px-3 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                  {addingChapter ? "Adding..." : "Add Chapter"}
                </button>
                <button type="button" onClick={() => setShowAddChapter(false)} className="text-xs text-slate-500">
                  Cancel
                </button>
              </div>
            </div>
          )}
          <select
            value={formData.chapter}
            onChange={(e) => {
              setFormData({ ...formData, chapter: e.target.value });
              clearFieldError("chapter");
            }}
            disabled={!formData.subject}
            className={`w-full px-4 py-2.5 border rounded-xl text-sm disabled:opacity-50 ${
              fieldErrors.chapter ? "border-red-300" : "border-slate-200"
            }`}
          >
            <option value="">Select chapter (or leave as General)</option>
            {filteredChapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          {fieldErrors.chapter && <p className="mt-1 text-xs text-red-600">{fieldErrors.chapter}</p>}
        </div>

        <div id="field-college" className="relative">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Colleges {formData.isPublic ? <span className="text-slate-400">(optional, pick more than one)</span> : <span className="text-red-500">*</span>}
          </label>
          {selectedColleges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedColleges.map((college) => (
                <span
                  key={college.id}
                  className="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-sm text-violet-800"
                >
                  <Check className="w-3.5 h-3.5" />
                  {college.name}
                  {college.code ? <span className="text-violet-400">({college.code})</span> : null}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        collegeIds: formData.collegeIds.filter((id) => id !== college.id),
                        program: formData.collegeIds.filter((id) => id !== college.id).length ? formData.program : "",
                        section: "",
                      })
                    }
                    className="w-5 h-5 rounded-full hover:bg-violet-100 flex items-center justify-center"
                    aria-label={`Remove ${college.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={collegeQuery}
              onChange={(e) => {
                setCollegeQuery(e.target.value);
                setCollegeOpen(true);
              }}
              onFocus={() => setCollegeOpen(true)}
              onBlur={() => setTimeout(() => setCollegeOpen(false), 200)}
              placeholder={selectedColleges.length ? "Search to add another college" : "Search and select colleges"}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm ${
                fieldErrors.college ? "border-red-300" : "border-slate-200"
              }`}
            />
          </div>
          {collegeOpen && (
            <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg">
              {collegeResults.slice(0, 20).map((college) => {
                const attached = formData.collegeIds.includes(college.id);
                return (
                  <button
                    key={college.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const nextIds = attached
                        ? formData.collegeIds.filter((id) => id !== college.id)
                        : [...formData.collegeIds, college.id];
                      setFormData({
                        ...formData,
                        collegeIds: nextIds,
                        program: nextIds.length ? formData.program || college.programs?.[0]?.key || "" : "",
                        section: nextIds.length ? formData.section : "",
                        semester: nextIds.length ? formData.semester : "",
                      });
                      setCollegeQuery("");
                      clearFieldError("college");
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 ${
                      attached ? "bg-violet-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <span>
                      <span className="font-medium text-slate-800">{college.name}</span>
                      {college.code ? <span className="text-slate-400"> ({college.code})</span> : null}
                    </span>
                    {attached ? <Check className="w-4 h-4 text-violet-600 shrink-0" /> : null}
                  </button>
                );
              })}
              {collegeResults.length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-400">No colleges found.</p>
              )}
            </div>
          )}
          <p className="text-xs text-slate-400 mt-1.5">
            {selectedColleges.length
              ? `${selectedColleges.length} college${selectedColleges.length === 1 ? "" : "s"} attached. Search again to add more.`
              : "Attach one or more colleges so students can find this under those campuses."}
          </p>
          {fieldErrors.college && <p className="mt-1 text-xs text-red-600">{fieldErrors.college}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Program</label>
              <select
                value={formData.program}
                onChange={(e) => setFormData({ ...formData, program: e.target.value, section: "" })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
              >
                <option value="">Any program</option>
                {(collegePrograms.length ? collegePrograms : programs).map((p: any) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Branches <span className="text-slate-400 font-normal">(select one or more)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {branchOptions.map((code) => {
                  const active = formData.branches.includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleBranch(code)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                        active
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700"
                      }`}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Same notes can apply to CSE, AI, CSD, AIML, etc. College is optional — pick branches anytime.
                {formData.branches.length
                  ? ` Selected: ${formData.branches.join(", ")}.`
                  : " Leave empty for all branches."}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
              >
                <option value="">Any semester</option>
                {Array.from({ length: maxSemesters || 10 }, (_, i) => i + 1).map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
            {formData.collegeIds.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Section</label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
                >
                  <option value="">All sections</option>
                  {branchSections.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

        {formData.materialCategory === "question_paper" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Batch (e.g., 2020-2024)</label>
            <input
              type="text"
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              placeholder="e.g., 2020-2024"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Description <span className="text-slate-400">(optional)</span>
          </label>
          <RichTextEditor
            key={`${initialMaterial?.id || "new"}-${editorKey}`}
            content={formData.description}
            onChange={(html) => setFormData({ ...formData, description: html })}
            placeholder="Write a brief description about this material..."
          />
          <p className="text-xs text-slate-400 text-right mt-1">
            {descLength}/{DESC_MAX}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Tags</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-medium">
                {tag}
                <button type="button" onClick={() => setTags(tags.filter((item) => item !== tag))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(tagDraft);
              }
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              if (/[,#\n]/.test(text)) {
                e.preventDefault();
                addTag(`${tagDraft}${text}`);
              }
            }}
            onBlur={() => {
              if (tagDraft.trim()) addTag(tagDraft);
            }}
            placeholder="Add tags (e.g., data structures, algorithms)"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
          />
          <p className="text-xs text-slate-400 mt-1.5">
            Add up to {TAG_MAX} tags. Press Enter or comma after each tag, or paste a list.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Visibility <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isPublic: true })}
              className={`text-left p-4 rounded-xl border-2 ${
                formData.isPublic ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <Globe className={`w-5 h-5 mb-2 ${formData.isPublic ? "text-violet-600" : "text-slate-400"}`} />
              <p className="font-semibold text-sm text-slate-900">Public</p>
              <p className="text-xs text-slate-500 mt-0.5">Anyone can view and download</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isPublic: false })}
              className={`text-left p-4 rounded-xl border-2 ${
                !formData.isPublic ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <Lock className={`w-5 h-5 mb-2 ${!formData.isPublic ? "text-violet-600" : "text-slate-400"}`} />
              <p className="font-semibold text-sm text-slate-900">College Only</p>
              <p className="text-xs text-slate-500 mt-0.5">Only students from the selected college</p>
            </button>
          </div>
        </div>

        {userRole === "admin" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="under_review">Under Review</option>
            </select>
          </div>
        )}

        <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-50 border border-violet-100">
          <Shield className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
          <p className="text-sm text-violet-800">
            By uploading, you confirm that you own or have the necessary rights to share this content and it does not violate any policies.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(true)}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50"
          >
            <Rocket className="w-4 h-4" />
            {loading
              ? isEdit
                ? "Saving..."
                : "Uploading..."
              : isEdit
                ? "Save Changes"
                : userRole === "student"
                  ? "Submit for Review"
                  : "Publish"}
          </button>
        </div>
      </section>

      <div className="space-y-6">
        <section className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="text-lg font-bold text-slate-900">2. Cover image</h2>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
              Optional
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            This banner is only for the listing card. Students do not download it as a study file.
          </p>
          {thumbnail || thumbnailPreview ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbnailPreview} alt="" className="w-20 h-14 rounded-lg object-cover bg-slate-100" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {thumbnail?.name || "Current cover image"}
                </p>
                <p className="text-xs text-slate-400">
                  {thumbnail ? `${formatSize(thumbnail.size)} · Cover only` : "Saved cover · Cover only"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => {
                  setThumbnail(null);
                  setThumbnailPreview("");
                  setKeepThumbnailUrl("");
                }}
                className="p-2 text-slate-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => thumbnailInputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-slate-200 hover:border-violet-300 p-6 text-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/default-thumbnail.png" alt="" className="w-20 h-14 rounded-lg object-cover mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800">Upload thumbnail / banner</p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG or WebP · max 5MB</p>
            </button>
          )}
          <input
            ref={thumbnailInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (!file.type.startsWith("image/")) {
                toast.error("Cover image must be a JPG, PNG, or WebP");
                return;
              }
              if (file.size > 5 * 1024 * 1024) {
                toast.error("Cover image must be under 5MB");
                return;
              }
              setThumbnail(file);
              setThumbnailPreview(URL.createObjectURL(file));
            }}
          />
        </section>

        <section id="field-attachments" className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">3. Study files & links</h2>
          <p className="text-sm text-slate-500 mb-4">
            Add the actual resources students will open: PDFs, documents, images, YouTube videos, or web links.
          </p>
          {fieldErrors.attachments && (
            <p className="mb-3 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {fieldErrors.attachments}
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-slate-200 p-4 text-left hover:border-violet-300 hover:bg-violet-50/40"
            >
              <FileText className="w-5 h-5 text-red-500 mb-2" />
              <p className="text-sm font-semibold text-slate-900">Upload files</p>
              <p className="text-xs text-slate-500 mt-0.5">PDF, PPT, Word, Excel, images, or video files</p>
            </button>
            <button
              type="button"
              onClick={() => addEmptyResource("video")}
              className="rounded-xl border border-slate-200 p-4 text-left hover:border-violet-300 hover:bg-violet-50/40"
            >
              <Video className="w-5 h-5 text-blue-500 mb-2" />
              <p className="text-sm font-semibold text-slate-900">Add YouTube or link</p>
              <p className="text-xs text-slate-500 mt-0.5">Paste a YouTube URL or any web resource</p>
            </button>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
            }}
            className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
              dragOver ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-violet-300"
            }`}
          >
            <CloudUpload className="w-8 h-8 text-violet-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 mb-2">Or drag study files here</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold"
            >
              <Upload className="w-4 h-4" />
              Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <p className="text-xs text-slate-400 mt-3">Max {FILE_MAX_MB}MB per file. Cover image belongs in step 2, not here.</p>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {materialTypes
              .filter((item) => item.value === "video" || item.value === "link")
              .map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => addEmptyResource(item.value)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:border-violet-300"
                >
                  <item.icon className="w-3.5 h-3.5" />
                  Add {item.label === "Video" ? "YouTube URL" : "Web Link"}
                </button>
              ))}
          </div>

          {attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {attachments.map((item, index) => {
                const typeInfo = materialTypes.find((t) => t.value === item.type) || materialTypes[0];
                const TypeIcon = typeInfo.icon;
                const meta = item.file
                  ? `${typeInfo.label} • ${formatSize(item.file.size)}`
                  : item.fileName
                    ? `${typeInfo.label} • ${item.fileName}`
                    : item.externalUrl
                      ? youtubeId(item.externalUrl)
                        ? "YouTube Video"
                        : item.externalUrl
                      : item.fileUrl
                        ? "Uploaded"
                        : "Incomplete";
                return (
                  <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-3 py-3">
                      <div className="flex flex-col gap-0.5 text-slate-300">
                        <button type="button" onClick={() => moveAttachment(index, index === 0 ? 1 : -1)} className="hover:text-slate-500" aria-label="Reorder">
                          <GripVertical className="w-4 h-4" />
                        </button>
                      </div>
                      <div className={`w-9 h-9 rounded-lg ${typeInfo.color} flex items-center justify-center shrink-0`}>
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setPreviewId(item.id)}>
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {item.file?.name || item.fileName || item.externalUrl || `New ${typeInfo.label}`}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{meta}</p>
                      </button>
                      <button type="button" onClick={() => setEditingId(editingId === item.id ? null : item.id)} className="p-2 text-slate-400 hover:text-violet-600">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => removeAttachment(item.id)} className="p-2 text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {editingId === item.id && (
                      <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                        <div className="grid grid-cols-5 gap-1.5">
                          {materialTypes.map((type) => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() =>
                                updateAttachment(item.id, {
                                  type: type.value,
                                  file: type.value === "link" ? undefined : item.file,
                                  previewUrl: type.value === "link" ? undefined : item.previewUrl,
                                })
                              }
                              className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-medium ${
                                item.type === type.value ? `${type.color} border-current` : "border-slate-100 text-slate-400"
                              }`}
                            >
                              <type.icon className="w-3.5 h-3.5" />
                              {type.label}
                            </button>
                          ))}
                        </div>
                        {(item.type === "video" || item.type === "link") && (
                          <input
                            type="url"
                            value={item.externalUrl || ""}
                            onChange={(e) => updateAttachment(item.id, { externalUrl: e.target.value })}
                            placeholder={item.type === "video" ? "https://youtube.com/watch?v=..." : "https://..."}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          />
                        )}
                        {item.type !== "link" && (
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > FILE_MAX_MB * 1024 * 1024) {
                                toast.error(`File must be under ${FILE_MAX_MB}MB`);
                                return;
                              }
                              updateAttachment(item.id, {
                                file,
                                fileUrl: undefined,
                                fileName: file.name,
                                type: typeFromFile(file),
                                previewUrl: URL.createObjectURL(file),
                              });
                              filesRef.current.set(item.id, file);
                            }}
                            className="w-full text-sm"
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => addEmptyResource("pdf")}
            className="mt-4 w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700"
          >
            <Plus className="w-4 h-4 inline mr-1" /> Add More Resource
          </button>
        </section>

        <section className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900">4. Resource Preview</h2>
          <p className="text-sm text-slate-500 mb-4">Preview how your resources will appear to students.</p>
          {attachments.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Add a file or link to see a preview.</p>
          ) : (
            <div className="space-y-2">
              {attachments.map((item) => {
                const typeInfo = materialTypes.find((t) => t.value === item.type) || materialTypes[0];
                const open = (previewItem?.id || attachments[0]?.id) === item.id;
                return (
                  <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setPreviewId(item.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {item.file?.name || item.fileName || item.externalUrl || typeInfo.label}
                      </span>
                      <span className="flex items-center gap-2">
                        {item.id === attachments[0]?.id && (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                            Primary
                          </span>
                        )}
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
                      </span>
                    </button>
                    {open && (
                      <div className="border-t border-slate-100 bg-slate-50 p-3">
                        <ResourcePreview item={item} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </form>
  );
}

function ResourcePreview({ item }: { item: AttachmentItem }) {
  const yt = youtubeId(item.externalUrl);
  const src = item.previewUrl || item.fileUrl;
  if (item.type === "image" && src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className="max-h-72 mx-auto rounded-lg object-contain" />
    );
  }
  if (item.type === "pdf" && src) {
    return <iframe title="PDF preview" src={src} className="w-full h-72 rounded-lg bg-white" />;
  }
  if ((item.type === "assignment" || /\.(docx?|pptx?|xlsx?)($|\?)/i.test(item.fileName || src || "")) && src && !src.startsWith("blob:")) {
    return (
      <iframe
        title="Document preview"
        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(src)}`}
        className="w-full h-72 rounded-lg bg-white"
      />
    );
  }
  if (item.type === "video" && yt) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          title="Video preview"
          src={`https://www.youtube.com/embed/${yt}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (item.type === "video" && item.previewUrl) {
    return <video src={item.previewUrl} controls className="w-full max-h-72 rounded-lg bg-black" />;
  }
  if (item.externalUrl) {
    return (
      <a href={item.externalUrl} target="_blank" rel="noreferrer" className="block text-sm text-violet-700 break-all hover:underline">
        {item.externalUrl}
      </a>
    );
  }
  return <p className="text-sm text-slate-400 text-center py-8">Add a file or URL to preview this resource.</p>;
}
