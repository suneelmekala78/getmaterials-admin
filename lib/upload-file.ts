/** Upload a browser File through the API so S3 CORS never blocks the client. */
export async function uploadBrowserFile(file: File, folder: string) {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);

  let res: Response;
  try {
    res = await fetch("/api/upload", { method: "POST", body });
  } catch {
    throw new Error("Could not reach the upload server. Is the API running on port 4000?");
  }

  const data = await res.json().catch(() => ({} as { error?: string; fileUrl?: string }));
  if (!res.ok || !data.fileUrl) {
    throw new Error(data.error || "Failed to upload file");
  }
  return { fileUrl: data.fileUrl as string };
}
