/** Amplify/CloudFront rejects POSTs above ~6MB. Large files go straight to S3. */
const PROXY_MAX_BYTES = 4.5 * 1024 * 1024;

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

async function uploadViaProxy(file: File, folder: string) {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);

  let res: Response;
  try {
    res = await fetch("/api/upload", { method: "POST", body });
  } catch {
    throw new Error("Could not reach the upload server. Please try again.");
  }

  if (res.status === 413) {
    throw new Error(
      "This file is too large to upload through the admin app. Refresh and try again so it uploads directly to storage.",
    );
  }

  const data = await res.json().catch(() => ({} as { error?: string; fileUrl?: string }));
  if (!res.ok || !data.fileUrl) {
    throw new Error(data.error || "Failed to upload file");
  }
  return { fileUrl: data.fileUrl as string };
}

export async function uploadBrowserFile(file: File, folder: string) {
  const contentType = guessContentType(file);

  try {
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
    const uploadUrl = presign.presignedUrl || presign.uploadUrl;
    if (presignRes.ok && uploadUrl && presign.fileUrl) {
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (put.ok) return { fileUrl: presign.fileUrl };
    }
  } catch (error) {
    console.error("[upload] direct S3 upload failed", error);
  }

  if (file.size <= PROXY_MAX_BYTES) {
    return uploadViaProxy(file, folder);
  }

  throw new Error(
    "This file is too large to send through admin.getmaterials.in. Direct storage upload failed. After deploy, retry — or confirm the S3 bucket allows PUT from admin.getmaterials.in.",
  );
}
