import { connectDB, Donation } from "@getmaterials/database";
import { Heart, IndianRupee, TrendingUp, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Donations - Admin - GetMaterials",
};

export default async function AdminDonationsPage() {
  await connectDB();

  const [donations, totals] = await Promise.all([
    Donation.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    Donation.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
        },
      },
    ]),
  ]);

  const stats = totals[0] || { total: 0, count: 0, avgAmount: 0 };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Donations</h1>
        <p className="text-slate-500 mt-1">Track community support and donations.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: IndianRupee, label: "Total Raised", value: `₹${stats.total.toLocaleString()}`, color: "bg-emerald-50 text-emerald-600" },
          { icon: Heart, label: "Total Donations", value: stats.count.toString(), color: "bg-pink-50 text-pink-600" },
          { icon: TrendingUp, label: "Average Amount", value: `₹${Math.round(stats.avgAmount || 0)}`, color: "bg-violet-50 text-violet-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-slate-100">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Donations table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Recent Donations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Donor</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {donations.map((donation: any) => (
                <tr key={donation._id.toString()} className="table-row-hover">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                        {(donation.user as any)?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{(donation.user as any)?.name || "Anonymous"}</p>
                        <p className="text-xs text-slate-500">{(donation.user as any)?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-slate-900">₹{donation.amount}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-lg capitalize ${
                      donation.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                      donation.status === "pending" ? "bg-amber-50 text-amber-700" :
                      "bg-red-50 text-red-700"
                    }`}>
                      {donation.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {donations.length === 0 && (
          <div className="p-12 text-center">
            <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No donations yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
