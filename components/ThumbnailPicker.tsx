"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadBrowserFile } from "@/lib/upload-file";

type SharedThumb = {
  _id: string;
  url: string;
  title?: string;
  visibility: "public" | "private";
};

export default function ThumbnailPicker({
  value,
  onChange,
  label = "Thumbnail",
}: {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [library, setLibrary] = useState<SharedThumb[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [error, setError] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);

  const loadLibrary = async () => {
    try {
      const res = await fetch("/api/thumbnails");
      const data = await res.json();
      setLibrary(data.thumbnails || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const uploaded = await uploadBrowserFile(file, "thumbnails");
      const res = await fetch("/api/thumbnails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: uploaded.fileUrl,
          visibility,
          title: file.name.replace(/\.[^.]+$/, ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save thumbnail");
      onChange(uploaded.fileUrl);
      setLibrary((prev) => [data.thumbnail, ...prev]);
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        {label} <span className="font-normal text-slate-400">(optional)</span>
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative h-28 w-44 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
              <ImagePlus className="h-6 w-6" />
              <span className="mt-1 text-[11px]">No thumbnail</span>
            </div>
          )}
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-1.5 top-1.5 rounded-full bg-black/55 p-1 text-white hover:bg-black/70"
              title="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              Upload new
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleUpload(e.target.files?.[0])}
              />
            </label>
            <button
              type="button"
              onClick={() => setShowLibrary((v) => !v)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {showLibrary ? "Hide library" : "Choose from library"}
            </button>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="text-xs font-medium text-slate-600 mb-2">When uploading, share with:</p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-700">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="admin-thumb-visibility"
                  checked={visibility === "private"}
                  onChange={() => setVisibility("private")}
                  className="text-violet-600"
                />
                Only me
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="admin-thumb-visibility"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                  className="text-violet-600"
                />
                Anyone can use
              </label>
            </div>
          </div>

          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
      </div>

      {showLibrary ? (
        <div className="rounded-xl border border-slate-100 p-3">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
            </div>
          ) : library.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">
              No saved thumbnails yet. Upload one to get started.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {library.map((thumb) => (
                <button
                  key={thumb._id}
                  type="button"
                  onClick={() => {
                    onChange(thumb.url);
                    setShowLibrary(false);
                  }}
                  className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition ${
                    value === thumb.url
                      ? "border-violet-500 ring-2 ring-violet-200"
                      : "border-transparent hover:border-violet-200"
                  }`}
                  title={thumb.title || (thumb.visibility === "public" ? "Shared" : "Only you")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb.url} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">
                    {thumb.visibility === "public" ? "Anyone" : "Only me"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
