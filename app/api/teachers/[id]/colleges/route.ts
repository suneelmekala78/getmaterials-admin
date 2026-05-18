import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, User, College } from "@getmaterials/database";

// GET /api/teachers/[id]/colleges - get assigned colleges
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const teacher = await User.findById(id)
    .select("assignedColleges college")
    .populate("assignedColleges", "name code")
    .populate("college", "name code")
    .lean() as any;

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  return NextResponse.json({
    college: teacher.college,
    assignedColleges: teacher.assignedColleges || [],
  });
}

// PATCH /api/teachers/[id]/colleges - assign colleges to a teacher
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { collegeIds } = await req.json();

  if (!Array.isArray(collegeIds)) {
    return NextResponse.json({ error: "collegeIds must be an array" }, { status: 400 });
  }

  await connectDB();

  // Verify all colleges exist
  const colleges = await College.find({ _id: { $in: collegeIds } }).select("_id");
  if (colleges.length !== collegeIds.length) {
    return NextResponse.json({ error: "One or more colleges not found" }, { status: 400 });
  }

  const teacher = await User.findOneAndUpdate(
    { _id: id, role: "teacher" },
    { assignedColleges: collegeIds },
    { new: true }
  )
    .select("name email assignedColleges")
    .populate("assignedColleges", "name code");

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Colleges assigned", teacher });
}
