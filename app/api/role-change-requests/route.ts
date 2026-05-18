import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, RoleChangeRequest, User } from "@getmaterials/database";

export const dynamic = "force-dynamic";

// GET /api/role-change-requests - list all role change requests
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const requests = await RoleChangeRequest.find()
      .populate("user", "name email role avatar college")
      .populate("processedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: "Failed to fetch role change requests" }, { status: 500 });
  }
}

// PATCH /api/role-change-requests - approve or reject a request
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, action, adminNote } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: "Request ID and action are required" }, { status: 400 });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Action must be 'approve' or 'reject'" }, { status: 400 });
    }

    await connectDB();

    const roleRequest = await RoleChangeRequest.findById(id);
    if (!roleRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (roleRequest.status !== "pending") {
      return NextResponse.json({ error: "Request has already been processed" }, { status: 400 });
    }

    const adminId = (session.user as any).id;

    if (action === "approve") {
      // Update the user's role
      await User.findByIdAndUpdate(roleRequest.user, { role: roleRequest.toRole });

      roleRequest.status = "approved";
      roleRequest.processedBy = adminId;
      roleRequest.processedAt = new Date();
      roleRequest.adminNote = adminNote || undefined;
      await roleRequest.save();
    } else {
      roleRequest.status = "rejected";
      roleRequest.processedBy = adminId;
      roleRequest.processedAt = new Date();
      roleRequest.adminNote = adminNote || undefined;
      await roleRequest.save();
    }

    const updated = await RoleChangeRequest.findById(id)
      .populate("user", "name email role")
      .populate("processedBy", "name email")
      .lean();

    return NextResponse.json({
      message: `Request ${action === "approve" ? "approved" : "rejected"} successfully`,
      request: updated,
    });
  } catch {
    return NextResponse.json({ error: "Failed to process role change request" }, { status: 500 });
  }
}
