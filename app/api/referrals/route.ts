import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Referral } from "@getmaterials/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get overall stats
    const [
      totalReferrals,
      sourceBreakdown,
      referrerBreakdown,
      campaignBreakdown,
      recentReferrals,
      dailySignups,
    ] = await Promise.all([
      Referral.countDocuments(),
      Referral.aggregate([
        { $group: { _id: "$source", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      Referral.aggregate([
        { $match: { referrer: { $ne: "" } } },
        { $group: { _id: "$referrer", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      Referral.aggregate([
        { $match: { campaign: { $ne: "" } } },
        { $group: { _id: "$campaign", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      Referral.find()
        .populate("user", "name email role")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Referral.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
    ]);

    return NextResponse.json({
      totalReferrals,
      sourceBreakdown,
      referrerBreakdown,
      campaignBreakdown,
      recentReferrals: recentReferrals.map((r: any) => ({
        id: r._id.toString(),
        user: r.user
          ? { name: r.user.name, email: r.user.email, role: r.user.role }
          : null,
        source: r.source,
        medium: r.medium,
        campaign: r.campaign,
        referrer: r.referrer,
        referralCode: r.referralCode,
        landingPage: r.landingPage,
        createdAt: r.createdAt,
      })),
      dailySignups: dailySignups.reverse(),
    });
  } catch (error) {
    console.error("Referrals API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
