import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPresignedUploadUrl, generateS3Key, getS3Url } from "@/lib/s3";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@getmaterials/shared";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fileName, fileType, fileSize, folder = "materials" } = body;

    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileType, fileSize" },
        { status: 400 }
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 100MB limit" },
        { status: 400 }
      );
    }

    const allAllowed = [
      ...ALLOWED_FILE_TYPES.pdf,
      ...ALLOWED_FILE_TYPES.image,
      ...ALLOWED_FILE_TYPES.video,
    ];
    if (!allAllowed.includes(fileType)) {
      return NextResponse.json(
        { error: `File type "${fileType}" is not allowed` },
        { status: 400 }
      );
    }

    const key = generateS3Key(folder, fileName);
    const presignedUrl = await getPresignedUploadUrl(key, fileType);
    const fileUrl = getS3Url(key);

    return NextResponse.json({ presignedUrl, fileUrl, key });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
