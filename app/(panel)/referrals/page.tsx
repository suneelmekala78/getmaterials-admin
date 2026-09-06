import { auth } from "@/lib/auth";
import { adminApi } from "@/lib/express-proxy";
import { redirect } from "next/navigation";
import { ReferralDashboard } from "./ReferralDashboard";
import { ApiOfflineBanner } from "@/components/ApiOfflineBanner";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Referral Tracking - Admin - GetMaterials",
};

const emptyReferralData = {
  totalUsers: 0,
  totalReferrals: 0,
  sourceBreakdown: [],
  referrerBreakdown: [],
  campaignBreakdown: [],
  topSharers: [],
  recentReferrals: [],
  dailySignups: [],
};

export default async function ReferralsPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    redirect("/login");
  }

  let data = emptyReferralData;
  let apiError = "";

  try {
    data = { ...emptyReferralData, ...(await adminApi("/api/admin/referrals/analytics")) };
  } catch (error) {
    apiError = error instanceof Error ? error.message : "API unavailable";
  }

  return (
    <div className="space-y-6">
      {apiError ? <ApiOfflineBanner detail={apiError} /> : null}
      <ReferralDashboard data={data} />
    </div>
  );
}
