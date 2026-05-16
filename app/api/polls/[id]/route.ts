import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Poll } from "@getmaterials/database";

// GET /api/polls/[id] - get poll with responses
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const poll = await Poll.findById(id)
      .populate("responses.user", "name email role")
      .lean();

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    return NextResponse.json({ poll });
  } catch {
    return NextResponse.json({ error: "Failed to fetch poll" }, { status: 500 });
  }
}

// PATCH /api/polls/[id] - toggle active
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    await connectDB();

    const poll = await Poll.findByIdAndUpdate(id, body, { new: true });
    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Poll updated", poll });
  } catch {
    return NextResponse.json({ error: "Failed to update poll" }, { status: 500 });
  }
}

// DELETE /api/polls/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    await Poll.findByIdAndDelete(id);
    return NextResponse.json({ message: "Poll deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete poll" }, { status: 500 });
  }
}
