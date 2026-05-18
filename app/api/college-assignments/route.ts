import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, CollegeAssignment } from "@getmaterials/database";

export const dynamic = "force-dynamic";

// GET /api/college-assignments - list all assignments (optionally filtered)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const collegeId = searchParams.get("college");
    const subjectId = searchParams.get("subject");

    await connectDB();

    const query: Record<string, any> = {};
    if (collegeId) query.college = collegeId;
    if (subjectId) query.subject = subjectId;

    const assignments = await CollegeAssignment.find(query)
      .populate("college", "name code")
      .populate("subject", "name")
      .populate("chapter", "title")
      .sort({ college: 1, semester: 1, subject: 1 })
      .limit(500)
      .lean();

    return NextResponse.json({ assignments });
  } catch {
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

// POST /api/college-assignments - create a new assignment
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { college, subject, chapter, semester, unit, program, branch, batchStart, batchEnd } = body;

    if (!college || !subject || !semester || !batchStart || !batchEnd) {
      return NextResponse.json(
        { error: "College, subject, semester, batch start and batch end are required" },
        { status: 400 }
      );
    }

    if (batchStart > batchEnd) {
      return NextResponse.json({ error: "Batch start year must be before end year" }, { status: 400 });
    }

    await connectDB();

    const assignment = await CollegeAssignment.create({
      college,
      subject,
      chapter: chapter || undefined,
      semester,
      unit: unit || undefined,
      program: program || "btech",
      branch: branch?.trim() || undefined,
      batchStart,
      batchEnd,
      createdBy: (session.user as any).id,
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "This subject is already assigned to this college for the same semester/program/branch/batch" },
        { status: 409 }
      );
    }
    console.error("Create assignment error:", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}

// PATCH /api/college-assignments - update an assignment
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    if (updates.batchStart && updates.batchEnd && updates.batchStart > updates.batchEnd) {
      return NextResponse.json({ error: "Batch start year must be before end year" }, { status: 400 });
    }

    await connectDB();

    const assignment = await CollegeAssignment.findByIdAndUpdate(id, updates, { new: true });
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Assignment updated", assignment });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "Duplicate assignment for this college/subject/semester/batch combination" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
  }
}

// DELETE /api/college-assignments - delete an assignment
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    await connectDB();
    const assignment = await CollegeAssignment.findByIdAndDelete(id);
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Assignment deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
