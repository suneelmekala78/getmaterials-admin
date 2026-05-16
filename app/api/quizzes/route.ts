import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Quiz, Subject, Chapter } from "@getmaterials/database";

export const dynamic = "force-dynamic";

// GET /api/quizzes - list all quizzes
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const quizzes = await Quiz.find()
      .populate("subject", "name")
      .populate("chapter", "title")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error("Get quizzes error:", error);
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 });
  }
}

// POST /api/quizzes - create a new quiz
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, subject, chapter, questions, duration, passingScore } = body;

    if (!title || !subject || !chapter || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Title, subject, chapter, and at least one question are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const quiz = await Quiz.create({
      title,
      description,
      subject,
      chapter,
      questions,
      duration: duration || 30,
      passingScore: passingScore || 60,
      isActive: true,
    });

    return NextResponse.json({ message: "Quiz created", quiz }, { status: 201 });
  } catch (error) {
    console.error("Create quiz error:", error);
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }
}
