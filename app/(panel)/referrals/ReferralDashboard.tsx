"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  Globe,
  UserCheck,
  Link2,
  Calendar,
  Copy,
  CheckCircle,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { UserAvatar } from "@/components/UserAvatar";

interface ReferralData {
  totalUsers?: number;
  totalReferrals: number;
  sourceBreakdown: { source: string; count: number }[];
  referrerBreakdown: { referrer: string; count: number }[];
  campaignBreakdown: { campaign: string; count: number }[];
  topSharers?: {
    referredBy: string;
    opens: number;
    shares: number;
    user: { name: string; email: string; slug?: string } | null;
  }[];
  recentReferrals: {
    id: string;
    user: {
      id?: string;
      name: string;
      email: string;
      role: string;
      status?: string;
      avatar?: string;
    } | null;
    source: string;
    medium: string;
    campaign: string;
    referrer: string;
    referralCode: string;
    landingPage: string;
    platform?: string;
    signupMeta?: {
      platform?: string;
      device?: string;
      ip?: string;
      country?: string;
      city?: string;
      region?: string;
      userAgent?: string;
    };
    createdAt: string;
  }[];
  dailySignups: { date: string; count: number }[];
}

interface Props {
  data: ReferralData;
}

/** Always show dates as "16 Aug 2026". */
function formatDisplayDate(value: string | Date) {
  const raw = String(value || "");
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const d = dateOnly ? new Date(`${raw}T12:00:00`) : new Date(raw);
  if (Number.isNaN(d.getTime())) return raw || "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Signup / referral timestamps with time. */
function formatDisplayDateTime(value: string | Date) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value || "—");
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const sourceColors: Record<string, string> = {
  instagram: "bg-pink-100 text-pink-700",
  youtube: "bg-red-100 text-red-700",
  twitter: "bg-sky-100 text-sky-700",
  facebook: "bg-blue-100 text-blue-700",
  whatsapp: "bg-green-100 text-green-700",
  telegram: "bg-blue-100 text-blue-700",
  google: "bg-amber-100 text-amber-700",
  apple: "bg-slate-200 text-slate-800",
  direct: "bg-slate-100 text-slate-700",
  untracked: "bg-orange-100 text-orange-700",
};

function getSourceColor(source: string) {
  return sourceColors[source] || "bg-violet-100 text-violet-700";
}

const roleConfig: Record<string, string> = {
  student: "bg-blue-50 text-blue-700",
  teacher: "bg-violet-50 text-violet-700",
  college_admin: "bg-emerald-50 text-emerald-700",
  admin: "bg-amber-50 text-amber-700",
};

const statusConfig: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  suspended: "bg-red-50 text-red-700",
};

function formatLocation(meta?: {
  city?: string;
  region?: string;
  country?: string;
}) {
  if (!meta) return "";
  return [meta.city, meta.region, meta.country].filter(Boolean).join(", ");
}

export function ReferralDashboard({ data }: Props) {
  const [copiedLink, setCopiedLink] = useState("");
  const appUrl = "https://getmaterials.in";

  const copyReferralLink = (referrer: string) => {
    const link = `${appUrl}/?utm_source=referral&utm_medium=social&ref=${referrer}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(referrer);
    toast.success("Link copied!");
    setTimeout(() => setCopiedLink(""), 2000);
  };

  const sourceBreakdown = data.sourceBreakdown || [];
  const referrerBreakdown = data.referrerBreakdown || [];
  const campaignBreakdown = data.campaignBreakdown || [];
  const topSharers = data.topSharers || [];
  const recentReferrals = data.recentReferrals || [];
  const dailySignups = data.dailySignups || [];
  const maxSource = sourceBreakdown[0]?.count || 1;
  const maxReferrer = referrerBreakdown[0]?.count || 1;
  const maxOpens = Math.max(1, ...topSharers.map((t) => t.opens));
  const maxDay = Math.max(1, ...dailySignups.map((d) => d.count));
  const totalUsers = data.totalUsers ?? data.totalReferrals;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Referral Tracking</h1>
        <p className="text-slate-500 mt-1">
          Track where your users are coming from and who brought them.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={totalUsers}
          color="text-violet-600 bg-violet-50"
        />
        <StatCard
          icon={Link2}
          label="Attribution Records"
          value={data.totalReferrals}
          color="text-indigo-600 bg-indigo-50"
        />
        <StatCard
          icon={Globe}
          label="Traffic Sources"
          value={sourceBreakdown.length}
          color="text-blue-600 bg-blue-50"
        />
        <StatCard
          icon={UserCheck}
          label="Unique Referrers"
          value={referrerBreakdown.length}
          color="text-emerald-600 bg-emerald-50"
        />
      </div>

      {/* Referral Link Generator */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Generate Referral Links</h2>
        <p className="text-sm text-slate-500 mb-4">
          Share these links with influencers/friends to track their signups.
        </p>
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">URL Format</p>
          <code className="block text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 break-all">
            {appUrl}/?utm_source=<span className="text-violet-600">[platform]</span>&utm_medium=<span className="text-violet-600">[type]</span>&utm_campaign=<span className="text-violet-600">[campaign]</span>&ref=<span className="text-violet-600">[person_name]</span>
          </code>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
            <div><strong>utm_source:</strong> instagram, youtube, twitter, whatsapp</div>
            <div><strong>utm_medium:</strong> social, paid, referral, organic</div>
            <div><strong>utm_campaign:</strong> launch, promo_may, exam_season</div>
            <div><strong>ref:</strong> friend_name or influencer_id</div>
          </div>
          <p className="text-xs text-slate-500 pt-1 border-t border-slate-200">
            User shares (website/app) also append <code className="bg-white px-1 rounded">ref=[username]</code>.
            Link opens and share counts are tracked below — sources/campaigns/signups stay as before.
          </p>
        </div>
      </div>

      {/* Top sharers by real opens */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-600" />
          Top sharers (link opens)
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Extra tracking: counted when someone opens a shared link with <code>ref=</code> — not just when it was shared.
        </p>
        {topSharers.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">No share opens yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 font-semibold text-slate-600 w-12">#</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Sharer</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Code</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Opens</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Shares</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Reach</th>
                </tr>
              </thead>
              <tbody>
                {topSharers.map((row, index) => (
                  <tr key={row.referredBy} className="border-b border-slate-50">
                    <td className="py-2.5 px-3 text-xs text-slate-400">{index + 1}</td>
                    <td className="py-2.5 px-3">
                      {row.user ? (
                        <div>
                          <p className="font-medium text-slate-800">{row.user.name}</p>
                          <p className="text-xs text-slate-400">{row.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500">{row.referredBy}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-600">{row.referredBy}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-violet-700">{row.opens}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{row.shares}</td>
                    <td className="py-2.5 px-3 min-w-[120px]">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${(row.opens / maxOpens) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two-column breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Traffic Sources
          </h2>
          {sourceBreakdown.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No data yet</p>
          ) : (
            <div className="space-y-3">
              {sourceBreakdown.map((item) => (
                <div key={item.source} className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getSourceColor(item.source)}`}
                  >
                    {item.source}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(item.count / maxSource) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-700 min-w-[40px] text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Referrer Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            Top Referrers (Friends / Influencers)
          </h2>
          {referrerBreakdown.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No referrer data yet</p>
          ) : (
            <div className="space-y-3">
              {referrerBreakdown.map((item) => (
                <div key={item.referrer} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-800 min-w-[100px] truncate">
                    {item.referrer}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(item.count / maxReferrer) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-700 min-w-[40px] text-right">
                    {item.count}
                  </span>
                  <button
                    onClick={() => copyReferralLink(item.referrer)}
                    className="p-1.5 text-slate-400 hover:text-violet-600 transition-colors"
                    title="Copy referral link"
                  >
                    {copiedLink === item.referrer ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Breakdown */}
      {campaignBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Campaigns
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {campaignBreakdown.map((item) => (
              <div
                key={item.campaign}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
              >
                <span className="text-sm font-medium text-slate-700">{item.campaign}</span>
                <span className="text-sm font-bold text-amber-600">{item.count} signups</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Signups Chart (simple) */}
      {dailySignups.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-600" />
            Daily Signups (Last 30 Days)
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Based on account creation dates (India time). Hover a bar for the exact day count.
          </p>
          <div className="flex items-end gap-1 h-36">
            {dailySignups.map((day) => {
              const height = maxDay > 0 ? (day.count / maxDay) * 100 : 0;
              return (
                <div
                  key={day.date}
                  className="flex-1 group relative flex flex-col justify-end h-full"
                  title={`${formatDisplayDate(day.date)}: ${day.count} signup${day.count === 1 ? "" : "s"}`}
                >
                  <div
                    className={`w-full rounded-t-sm transition-all ${
                      day.count > 0
                        ? "bg-violet-500 hover:bg-violet-600"
                        : "bg-slate-100"
                    }`}
                    style={{
                      height: day.count > 0 ? `${Math.max(height, 8)}%` : "2px",
                    }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                    {formatDisplayDate(day.date)}: {day.count}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-slate-400">
            <span>{formatDisplayDate(dailySignups[0]?.date)}</span>
            <span>{formatDisplayDate(dailySignups[dailySignups.length - 1]?.date)}</span>
          </div>
        </div>
      )}

      {/* Recent Signups — aligned with Users page table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Recent Signups</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Latest accounts with referral attribution (same layout as Users).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">#</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Referrer</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Signup</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentReferrals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400 text-sm">
                    No referral data yet. Share your referral links to start tracking!
                  </td>
                </tr>
              ) : (
                recentReferrals.map((r, index) => {
                  const platform =
                    r.platform || r.signupMeta?.platform || "";
                  const userId = r.user?.id || r.id;
                  return (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 text-xs text-slate-400 tabular-nums">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4">
                      {r.user ? (
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={r.user.name}
                            image={r.user.avatar}
                            role={r.user.role}
                            size={36}
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/users/${userId}`}
                              className="text-sm font-medium text-slate-900 truncate hover:text-violet-700"
                            >
                              {r.user.name}
                            </Link>
                            <p className="text-xs text-slate-500 truncate">{r.user.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">Deleted user</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {r.user ? (
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-medium rounded-lg capitalize ${
                            roleConfig[r.user.role] || "bg-slate-50 text-slate-700"
                          }`}
                        >
                          {String(r.user.role || "").replace("_", " ")}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {r.user?.status ? (
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-medium rounded-lg capitalize ${
                            statusConfig[r.user.status] || "bg-slate-50 text-slate-700"
                          }`}
                        >
                          {r.user.status}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getSourceColor(r.source)}`}
                      >
                        {r.source || "direct"}
                      </span>
                      {r.medium ? (
                        <span className="text-xs text-slate-400 ml-1">/ {r.medium}</span>
                      ) : null}
                      {r.campaign ? (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                          {r.campaign}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 font-medium">
                      {r.referrer || "—"}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {r.signupMeta || platform ? (
                        <div className="space-y-0.5 max-w-[180px]">
                          <p className="capitalize">
                            {[platform, r.signupMeta?.device]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </p>
                          {formatLocation(r.signupMeta) ? (
                            <p className="text-slate-400 truncate">
                              {formatLocation(r.signupMeta)}
                            </p>
                          ) : null}
                          {r.signupMeta?.ip ? (
                            <p className="text-slate-400 font-mono text-[10px]">
                              {r.signupMeta.ip}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDisplayDateTime(r.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {userId ? (
                        <Link
                          href={`/users/${userId}`}
                          className="inline-flex p-2 text-violet-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                          title="View user"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
