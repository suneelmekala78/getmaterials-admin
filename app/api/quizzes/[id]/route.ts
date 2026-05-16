import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Quiz } from "@getmaterials/database";

// GET /api/quizzes/[id]
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

    const quiz = await Quiz.findById(id)
      .populate("subject", "name")
      .populate("chapter", "title")
      .lean();

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}

// PATCH /api/quizzes/[id]
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

    const quiz = await Quiz.findByIdAndUpdate(id, body, { new: true });
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Quiz updated", quiz });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 });
  }
}

// DELETE /api/quizzes/[id]
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

    const quiz = await Quiz.findByIdAndDelete(id);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Quiz deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 });
  }
}
