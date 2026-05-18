import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, College } from "@getmaterials/database";

// POST /api/colleges/branches - add a branch to a college
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collegeId, program, name, sections } = await req.json();

    if (!collegeId || !program || !name) {
      return NextResponse.json({ error: "College ID, program, and branch name are required" }, { status: 400 });
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
    const exists = college.branches.some(
      (b: any) => b.program === program.toLowerCase() && b.name === name.toUpperCase()
    );
    if (exists) {
      return NextResponse.json({ error: "Branch already exists for this program" }, { status: 409 });
    }

    college.branches.push({
      program: program.toLowerCase(),
      name: name.toUpperCase(),
      sections: (sections || []).map((s: string) => s.toUpperCase()),
    });
    await college.save();

    return NextResponse.json({ message: "Branch added", college });
  } catch {
    return NextResponse.json({ error: "Failed to add branch" }, { status: 500 });
  }
}

// DELETE /api/colleges/branches - remove a branch from a college
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collegeId, program, name } = await req.json();

    if (!collegeId || !program || !name) {
      return NextResponse.json({ error: "College ID, program, and branch name required" }, { status: 400 });
    }

    await connectDB();

    const college = await College.findById(collegeId);
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    college.branches = college.branches.filter(
      (b: any) => !(b.program === program.toLowerCase() && b.name === name.toUpperCase())
    );
    // Also remove batches for this branch
    college.batches = college.batches.filter(
      (b: any) => !(b.program === program.toLowerCase() && b.branch === name.toUpperCase())
    );
    await college.save();

    return NextResponse.json({ message: "Branch removed", college });
  } catch {
    return NextResponse.json({ error: "Failed to remove branch" }, { status: 500 });
  }
}
