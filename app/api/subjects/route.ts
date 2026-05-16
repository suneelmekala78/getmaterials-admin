import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Subject } from "@getmaterials/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const subjects = await Subject.find({ isActive: true })
      .select("name slug category")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ subjects });
  } catch {
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}
