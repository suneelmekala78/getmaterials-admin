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

    await connectDB();

    if (subjectId) {
      const chapters = await Chapter.find({ subject: subjectId })
        .select("title slug order description")
        .sort({ order: 1 })
        .lean();
      return NextResponse.json({ chapters });
    }

    // Return all chapters with subject info
    const chapters = await Chapter.find()
      .populate("subject", "name")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({ chapters });
  } catch {
    return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, subject, order } = await req.json();

    if (!title?.trim() || !subject) {
      return NextResponse.json({ error: "Title and subject are required" }, { status: 400 });
    }

    await connectDB();

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await Chapter.findOne({ slug, subject });
    if (existing) {
      return NextResponse.json({ error: "A chapter with this name already exists in this subject" }, { status: 409 });
    }

    const chapter = await Chapter.create({
      title: title.trim(),
      slug,
      description: description?.trim() || "",
      subject,
      order: order ?? 0,
    });

    return NextResponse.json({ chapter }, { status: 201 });
  } catch (error) {
    console.error("Create chapter error:", error);
    return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, description, order } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 });
    }

    await connectDB();

    const updates: Record<string, unknown> = {};
    if (title?.trim()) {
      updates.title = title.trim();
      updates.slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (description !== undefined) updates.description = description?.trim() || "";
    if (order !== undefined) updates.order = order;

    const chapter = await Chapter.findByIdAndUpdate(id, updates, { new: true });
    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Chapter updated", chapter });
  } catch {
    return NextResponse.json({ error: "Failed to update chapter" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 });
    }

    await connectDB();
    const chapter = await Chapter.findByIdAndDelete(id);
    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Chapter deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete chapter" }, { status: 500 });
  }
}
