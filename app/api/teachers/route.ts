import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, User } from "@getmaterials/database";

// GET /api/teachers - list pending and approved teachers
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const [pending, approved] = await Promise.all([
    User.find({ role: "teacher", status: "pending" })
      .select("name email qualifications status createdAt assignedColleges")
      .populate("assignedColleges", "name code")
      .sort({ createdAt: -1 })
      .lean(),
    User.find({ role: "teacher", status: "active" })
      .select("name email qualifications status createdAt assignedColleges")
      .populate("assignedColleges", "name code")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return NextResponse.json({ pending, approved });
}
