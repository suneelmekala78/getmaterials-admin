import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, User, College } from "@getmaterials/database";

// POST /api/users/assign-college - assign a teacher to a college
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, collegeId, action } = await request.json();

    if (!userId || !collegeId) {
      return NextResponse.json({ error: "User ID and College ID are required" }, { status: 400 });
    }

    if (!action || !["assign", "remove"].includes(action)) {
      return NextResponse.json({ error: "Action must be 'assign' or 'remove'" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId).select("name email role assignedColleges");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "teacher") {
      return NextResponse.json({ error: "Only teachers can be assigned to colleges" }, { status: 400 });
    }

    const college = await College.findById(collegeId).select("name code");
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    if (action === "assign") {
      // Add college if not already assigned
      const alreadyAssigned = user.assignedColleges?.some(
        (c: any) => c.toString() === collegeId
      );
      if (alreadyAssigned) {
        return NextResponse.json({ error: "Teacher is already assigned to this college" }, { status: 409 });
      }
      await User.findByIdAndUpdate(userId, {
        $addToSet: { assignedColleges: collegeId },
      });
    } else {
      // Remove college
      await User.findByIdAndUpdate(userId, {
        $pull: { assignedColleges: collegeId },
      });
    }

    const updatedUser = await User.findById(userId)
      .select("name email role assignedColleges")
      .populate("assignedColleges", "name code")
      .lean();

    return NextResponse.json({
      message: action === "assign"
        ? `Teacher assigned to ${college.name}`
        : `Teacher removed from ${college.name}`,
      user: updatedUser,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update teacher assignment" }, { status: 500 });
  }
}
