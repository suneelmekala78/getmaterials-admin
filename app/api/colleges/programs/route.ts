import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, College } from "@getmaterials/database";

// POST /api/colleges/programs - add a program to a college
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collegeId, key, label, durationYears, totalSemesters } = await req.json();

    if (!collegeId || !key || !label || !durationYears || !totalSemesters) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await connectDB();

    const college = await College.findById(collegeId);
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    // Check if program already exists
    const exists = college.programs.some((p: any) => p.key === key.toLowerCase());
    if (exists) {
      return NextResponse.json({ error: "Program already exists in this college" }, { status: 409 });
    }

    college.programs.push({ key: key.toLowerCase(), label, durationYears, totalSemesters });
    await college.save();

    return NextResponse.json({ message: "Program added", college });
  } catch {
    return NextResponse.json({ error: "Failed to add program" }, { status: 500 });
  }
}

// DELETE /api/colleges/programs - remove a program from a college
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collegeId, programKey } = await req.json();

    if (!collegeId || !programKey) {
      return NextResponse.json({ error: "College ID and program key required" }, { status: 400 });
    }

    await connectDB();

    const college = await College.findById(collegeId);
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    college.programs = college.programs.filter((p: any) => p.key !== programKey);
    // Also remove branches and batches associated with this program
    college.branches = college.branches.filter((b: any) => b.program !== programKey);
    college.batches = college.batches.filter((b: any) => b.program !== programKey);
    await college.save();

    return NextResponse.json({ message: "Program removed", college });
  } catch {
    return NextResponse.json({ error: "Failed to remove program" }, { status: 500 });
  }
}
