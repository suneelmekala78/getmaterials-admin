import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Review } from "@getmaterials/database";

export const dynamic = "force-dynamic";

// GET /api/reviews - list all reviews
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const reviews = await Review.find()
      .populate("user", "name email avatar")
      .populate("material", "title slug")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// PATCH /api/reviews - approve/reject review
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, isApproved } = await req.json();

    if (!id || typeof isApproved !== "boolean") {
      return NextResponse.json({ error: "Review ID and approval status required" }, { status: 400 });
    }

    await connectDB();

    const review = await Review.findByIdAndUpdate(id, { isApproved }, { new: true })
      .populate("user", "name email avatar")
      .populate("material", "title slug");

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch {
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

// DELETE /api/reviews - delete review (admin)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Review ID required" }, { status: 400 });
    }

    await connectDB();

    await Review.findByIdAndDelete(id);
    return NextResponse.json({ message: "Review deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
