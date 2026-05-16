import { NextResponse } from "next/server";
import { connectDB, College } from "@getmaterials/database";

export const dynamic = "force-dynamic";

// GET /api/colleges - list all colleges
export async function GET() {
  try {
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
    const body = await request.json();
    const { name, location, code } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required." }, { status: 400 });
    }

    await connectDB();

    const existing = await College.findOne({ code: code.toUpperCase() });
    if (existing) {
      return NextResponse.json({ error: "A college with this code already exists." }, { status: 409 });
    }

    const college = await College.create({ name, location, code: code.toUpperCase() });
    return NextResponse.json({ message: "College created", college });
  } catch {
    return NextResponse.json({ error: "Failed to create college" }, { status: 500 });
  }
}

// DELETE /api/colleges - delete a college
export async function DELETE(request: Request) {
  try {
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
