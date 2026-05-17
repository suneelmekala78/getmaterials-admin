import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Subject } from "@getmaterials/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const subjects = await Subject.find()
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ subjects });
  } catch {
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, category } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Subject name is required" }, { status: 400 });
    }

    await connectDB();

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await Subject.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "A subject with this name already exists" }, { status: 409 });
    }

    const subject = await Subject.create({
      name: name.trim(),
      slug,
      description: description?.trim() || "",
      category: category || "general",
      isActive: true,
      materialsCount: 0,
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    console.error("Create subject error:", error);
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
  }
}
