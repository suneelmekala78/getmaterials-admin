import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, College } from "@getmaterials/database";

export const dynamic = "force-dynamic";

// GET /api/colleges - list all colleges
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const colleges = await College.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ colleges });
  } catch {
    return NextResponse.json({ error: "Failed to fetch colleges" }, { status: 500 });
  }
}

// POST /api/colleges - create a new college
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, location, code, logo, description } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required." }, { status: 400 });
    }

    await connectDB();

    const existing = await College.findOne({ code: code.toUpperCase() });
    if (existing) {
      return NextResponse.json({ error: "A college with this code already exists." }, { status: 409 });
    }

    const collegeData: any = { name, location, code: code.toUpperCase() };
    if (logo) collegeData.logo = logo;
    if (description) collegeData.description = description;

    const college = await College.create(collegeData);
    return NextResponse.json({ message: "College created", college });
  } catch {
    return NextResponse.json({ error: "Failed to create college" }, { status: 500 });
  }
}

// PATCH /api/colleges - update a college
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, location, code, logo, description } = body;

    if (!id) {
      return NextResponse.json({ error: "College ID required" }, { status: 400 });
    }
    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required." }, { status: 400 });
    }

    await connectDB();

    const existing = await College.findOne({ code: code.toUpperCase(), _id: { $ne: id } });
    if (existing) {
      return NextResponse.json({ error: "A college with this code already exists." }, { status: 409 });
    }

    const updateData: any = { name, location, code: code.toUpperCase() };
    if (logo !== undefined) updateData.logo = logo;
    if (description !== undefined) updateData.description = description;

    const college = await College.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "College updated", college });
  } catch {
    return NextResponse.json({ error: "Failed to update college" }, { status: 500 });
  }
}

// DELETE /api/colleges - delete a college
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "College ID required" }, { status: 400 });
    }

    await connectDB();
    await College.findByIdAndDelete(id);
    return NextResponse.json({ message: "College deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete college" }, { status: 500 });
  }
}
