function guessContentType(file: File) {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".mp4")) return "video/mp4";
  return "application/octet-stream";
}

export async function uploadBrowserFile(file: File, folder: string) {
  const contentType = guessContentType(file);

  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType,
      fileType: contentType,
      folder,
    }),
  });
  const presign = (await presignRes.json().catch(() => ({}))) as {
    error?: string;
    presignedUrl?: string;
    uploadUrl?: string;
    fileUrl?: string;
  };

  if (presignRes.status === 401 || /unauthorized/i.test(presign.error || "")) {
    throw new Error("Unauthorized");
  }
  if (!presignRes.ok) {
    throw new Error(presign.error || "Could not start upload");
  }

  const uploadUrl = presign.presignedUrl || presign.uploadUrl;
  if (!uploadUrl || !presign.fileUrl) {
    throw new Error("Could not start upload");
  }

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!put.ok) {
    throw new Error("Storage rejected the file. Try again, or use a smaller PDF.");
  }
  return { fileUrl: presign.fileUrl };
}
