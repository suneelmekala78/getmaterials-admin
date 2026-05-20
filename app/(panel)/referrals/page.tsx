import { connectDB, Referral } from "@getmaterials/database";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReferralDashboard } from "./ReferralDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Referral Tracking - Admin - GetMaterials",
};

export default async function ReferralsPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    redirect("/login");
  }

  await connectDB();

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
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]),
  ]);

  const data = {
    totalReferrals,
    sourceBreakdown: sourceBreakdown.map((s: any) => ({ source: s._id || "direct", count: s.count })),
    referrerBreakdown: referrerBreakdown.map((r: any) => ({ referrer: r._id, count: r.count })),
    campaignBreakdown: campaignBreakdown.map((c: any) => ({ campaign: c._id, count: c.count })),
    recentReferrals: recentReferrals.map((r: any) => ({
      id: r._id.toString(),
      user: r.user ? { name: r.user.name, email: r.user.email, role: r.user.role } : null,
      source: r.source,
      medium: r.medium,
      campaign: r.campaign,
      referrer: r.referrer,
      referralCode: r.referralCode,
      landingPage: r.landingPage,
      createdAt: r.createdAt.toISOString(),
    })),
    dailySignups: dailySignups.reverse().map((d: any) => ({ date: d._id, count: d.count })),
  };

  return <ReferralDashboard data={data} />;
}
