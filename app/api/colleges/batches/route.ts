import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, College } from "@getmaterials/database";

// POST /api/colleges/batches - add a batch to a college
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collegeId, program, branch, startYear, endYear } = await req.json();

    if (!collegeId || !program || !startYear || !endYear) {
      return NextResponse.json({ error: "College ID, program, start year, and end year are required" }, { status: 400 });
    }

    if (startYear >= endYear) {
      return NextResponse.json({ error: "Start year must be before end year" }, { status: 400 });
    }

    await connectDB();

    const college = await College.findById(collegeId);
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    // Verify program exists
    const programExists = college.programs.some((p: any) => p.key === program.toLowerCase());
    if (!programExists) {
      return NextResponse.json({ error: "Program not found in this college" }, { status: 400 });
    }

    // Check duplicate
    const exists = college.batches.some(
      (b: any) =>
        b.program === program.toLowerCase() &&
        b.startYear === startYear &&
        b.endYear === endYear &&
        (b.branch || "") === (branch ? branch.toUpperCase() : "")
    );
    if (exists) {
      return NextResponse.json({ error: "Batch already exists" }, { status: 409 });
    }

    college.batches.push({
      program: program.toLowerCase(),
      branch: branch ? branch.toUpperCase() : undefined,
      startYear,
      endYear,
    });
    await college.save();

    return NextResponse.json({ message: "Batch added", college });
  } catch {
    return NextResponse.json({ error: "Failed to add batch" }, { status: 500 });
  }
}

// DELETE /api/colleges/batches - remove a batch from a college
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collegeId, program, startYear, endYear } = await req.json();

    if (!collegeId || !program || !startYear || !endYear) {
      return NextResponse.json({ error: "College ID, program, start year, and end year required" }, { status: 400 });
    }

    await connectDB();

    const college = await College.findById(collegeId);
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    college.batches = college.batches.filter(
      (b: any) => !(b.program === program.toLowerCase() && b.startYear === startYear && b.endYear === endYear)
    );
    await college.save();

    return NextResponse.json({ message: "Batch removed", college });
  } catch {
    return NextResponse.json({ error: "Failed to remove batch" }, { status: 500 });
  }
}
