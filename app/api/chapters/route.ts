import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Chapter } from "@getmaterials/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subject");

    if (!subjectId) {
      return NextResponse.json({ error: "Subject ID required" }, { status: 400 });
    }

    await connectDB();
    const chapters = await Chapter.find({ subject: subjectId })
      .select("title slug order")
      .sort({ order: 1 })
      .lean();

    return NextResponse.json({ chapters });
  } catch {
    return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 });
  }
}
