import { NextRequest, NextResponse } from "next/server";
import { connectDB, User } from "@getmaterials/database";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await connectDB();

  const user = await User.findOneAndUpdate(
    { _id: id, role: "teacher", status: "pending" },
    { status: "active" },
    { new: true }
  );

  if (!user) {
    return NextResponse.json(
      { error: "Teacher not found or already processed" },
      { status: 404 }
    );
  }

  return NextResponse.redirect(new URL("/teachers", _req.url));
}
