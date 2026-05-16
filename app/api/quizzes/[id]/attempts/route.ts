import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, QuizAttempt } from "@getmaterials/database";

// GET /api/quizzes/[id]/attempts - get all attempts for a quiz
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

    const attempts = await QuizAttempt.find({ quiz: id })
      .populate("user", "name email avatar role")
      .sort({ completedAt: -1 })
      .lean();

    // Calculate stats
    const totalAttempts = attempts.length;
    const avgScore = totalAttempts > 0
      ? Math.round(attempts.reduce((sum: number, a: any) => sum + a.score, 0) / totalAttempts)
      : 0;
    const passCount = attempts.filter((a: any) => a.score >= 60).length;

    return NextResponse.json({
      attempts,
      stats: {
        total: totalAttempts,
        avgScore,
        passCount,
        failCount: totalAttempts - passCount,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch attempts" }, { status: 500 });
  }
}
