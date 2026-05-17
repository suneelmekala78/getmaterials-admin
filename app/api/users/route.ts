import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, User } from "@getmaterials/database";

export const dynamic = "force-dynamic";

// GET /api/users - list all users
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const users = await User.find()
      .sort({ createdAt: -1 })
      .select("name email role status createdAt")
      .limit(100)
      .lean();

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// PATCH /api/users - update user status or role
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, action, role } = await req.json();

    if (!id || !action) {
      return NextResponse.json({ error: "User ID and action required" }, { status: 400 });
    }

    await connectDB();

    let updateData: any = {};

    switch (action) {
      case "activate":
        updateData = { status: "active" };
        break;
      case "suspend":
        updateData = { status: "suspended" };
        break;
      case "change_role":
        if (!role || !["student", "teacher", "admin"].includes(role)) {
          return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }
        updateData = { role };
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(id, updateData, { new: true })
      .select("name email role status createdAt")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/users - delete a user
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    await connectDB();

    // Prevent self-deletion (admin session ID is email, not ObjectId)
    const targetUser = await User.findById(id).select("email").lean();
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if ((targetUser as any).email === session.user.email) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: "User deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
