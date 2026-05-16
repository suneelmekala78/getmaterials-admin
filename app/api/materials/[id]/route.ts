import { NextRequest, NextResponse } from "next/server";
import { connectDB, Material, Subject, Chapter } from "@getmaterials/database";
import { auth } from "@/lib/auth";

// Update material (status, title, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    await connectDB();

    const allowedFields = ["title", "status", "description", "type", "isPublic"];
    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const material = await Material.findByIdAndUpdate(id, updates, { new: true });

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Material updated", material });
  } catch (error) {
    console.error("Material update error:", error);
    return NextResponse.json({ error: "Failed to update material" }, { status: 500 });
  }
}

// Delete material
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const material = await Material.findById(id);
    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // Decrement counts on Subject and Chapter
    await Subject.findByIdAndUpdate(material.subject, { $inc: { materialsCount: -1 } });
    await Chapter.findByIdAndUpdate(material.chapter, { $inc: { materialsCount: -1 } });

    await Material.findByIdAndDelete(id);

    return NextResponse.json({ message: "Material deleted" });
  } catch (error) {
    console.error("Material delete error:", error);
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
  }
}
