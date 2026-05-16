import { NextRequest, NextResponse } from "next/server";
import { connectDB, Otp } from "@getmaterials/database";
import { sendOtpEmail } from "@/lib/mail";
import crypto from "crypto";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if email is in admin list
    if (!ADMIN_EMAILS.includes(normalizedEmail)) {
      return NextResponse.json(
        { error: "This email is not authorized for admin access" },
        { status: 403 }
      );
    }

    await connectDB();

    // Invalidate previous OTPs for this email
    await Otp.updateMany(
      { email: normalizedEmail, used: false },
      { used: true }
    );

    // Generate 6-digit OTP
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Otp.create({ email: normalizedEmail, code, expiresAt });

    // Send email
    await sendOtpEmail(normalizedEmail, code);

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
