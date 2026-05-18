import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToS3, generateS3Key, getS3Url } from "@/lib/s3";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@getmaterials/shared";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "materials";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 100MB limit" }, { status: 400 });
    }

    const allAllowed = [
      ...ALLOWED_FILE_TYPES.pdf,
      ...ALLOWED_FILE_TYPES.image,
      ...ALLOWED_FILE_TYPES.video,
    ];
    if (!allAllowed.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not allowed` },
        { status: 400 }
      );
    }

    const key = generateS3Key(folder, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToS3(key, buffer, file.type);
    const fileUrl = getS3Url(key);

    return NextResponse.json({ fileUrl, key });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
