import { auth } from "@/lib/auth";
import { adminApi } from "@/lib/express-proxy";
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

  const data = await adminApi("/api/admin/referrals/analytics");
  return <ReferralDashboard data={data} />;
}
