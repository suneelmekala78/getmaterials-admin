import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Poll } from "@getmaterials/database";

export const dynamic = "force-dynamic";

// GET /api/polls - list all polls
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const polls = await Poll.find()
      .sort({ createdAt: -1 })
      .lean();

    // Add response count
    const pollsWithStats = polls.map((poll: any) => ({
      ...poll,
      responseCount: poll.responses?.length || 0,
      responses: undefined, // Don't send full responses in list
    }));

    return NextResponse.json({ polls: pollsWithStats });
  } catch (error) {
    console.error("Get polls error:", error);
    return NextResponse.json({ error: "Failed to fetch polls" }, { status: 500 });
  }
}

// POST /api/polls - create a new poll
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { question, description, type, options } = body;

    if (!question || !type) {
      return NextResponse.json(
        { error: "Question and type are required" },
        { status: 400 }
      );
    }

    if (type === "multiple_choice" && (!options || options.length < 2)) {
      return NextResponse.json(
        { error: "Multiple choice polls need at least 2 options" },
        { status: 400 }
      );
    }

    await connectDB();

    const poll = await Poll.create({
      question,
      description,
      type,
      options: type === "multiple_choice" ? options : undefined,
      isActive: true,
    });

    return NextResponse.json({ message: "Poll created", poll }, { status: 201 });
  } catch (error) {
    console.error("Create poll error:", error);
    return NextResponse.json({ error: "Failed to create poll" }, { status: 500 });
  }
}
