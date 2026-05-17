"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  IndianRupee,
  TrendingUp,
  Calendar,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import toast from "react-hot-toast";

interface DonationItem {
  _id: string;
  user?: { name: string; email: string };
  name?: string;
  email?: string;
  amount: number;
  currency: string;
  method: string;
  transactionId: string;
  status: "pending" | "completed" | "failed";
  message?: string;
  createdAt: string;
}

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    amount: 0,
    status: "pending" as string,
    method: "",
  });

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const res = await fetch("/api/donations");
      const data = await res.json();
      setDonations(data.donations || []);
    } catch {
      toast.error("Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (donation: DonationItem) => {
    setEditId(donation._id);
    setEditData({
      name: donation.name || donation.user?.name || "",
      email: donation.email || donation.user?.email || "",
      amount: donation.amount,
      status: donation.status,
      method: donation.method,
    });
  };

  const cancelEdit = () => {
    setEditId(null);
  };

  const saveEdit = async () => {
    if (!editId) return;
    try {
      const res = await fetch("/api/donations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, ...editData }),
      });
      if (res.ok) {
        const data = await res.json();
        setDonations((prev) =>
          prev.map((d) => (d._id === editId ? { ...d, ...data.donation } : d))
        );
        toast.success("Donation updated");
        setEditId(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Failed to update donation");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/donations?id=${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDonations((prev) => prev.filter((d) => d._id !== deleteId));
        toast.success("Donation deleted");
      } else {
        toast.error("Failed to delete donation");
      }
    } catch {
      toast.error("Failed to delete donation");
    } finally {
      setDeleteId(null);
    }
  };

  const stats = {
    total: donations
      .filter((d) => d.status === "completed")
      .reduce((sum, d) => sum + d.amount, 0),
    count: donations.filter((d) => d.status === "completed").length,
    avgAmount: 0,
  };
  stats.avgAmount = stats.count > 0 ? Math.round(stats.total / stats.count) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Donations</h1>
        <p className="text-slate-500 mt-1">
          Track community support and donations. {donations.length} total.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: IndianRupee,
            label: "Total Raised",
            value: `₹${stats.total.toLocaleString()}`,
            color: "bg-emerald-50 text-emerald-600",
          },
          {
            icon: Heart,
            label: "Total Donations",
            value: stats.count.toString(),
            color: "bg-pink-50 text-pink-600",
          },
          {
            icon: TrendingUp,
            label: "Average Amount",
            value: `₹${stats.avgAmount}`,
            color: "bg-violet-50 text-violet-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-5 border border-slate-100"
          >
            <div
              className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}
            >
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
          <h2 className="text-base font-semibold text-slate-900">
            Recent Donations
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Donor
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {donations.map((donation) => {
                const donorName =
                  donation.name || (donation.user as any)?.name || "Anonymous";
                const donorEmail =
                  donation.email || (donation.user as any)?.email || "";
                const isEditing = editId === donation._id;

                return (
                  <tr key={donation._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={editData.name}
                            onChange={(e) =>
                              setEditData({ ...editData, name: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                            placeholder="Name"
                          />
                          <input
                            type="email"
                            value={editData.email}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                            placeholder="Email"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {donorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {donorName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {donorEmail}
                            </p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editData.amount}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              amount: Number(e.target.value),
                            })
                          }
                          className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                          min={0}
                        />
                      ) : (
                        <span className="text-sm font-semibold text-slate-900">
                          ₹{donation.amount}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.method}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              method: e.target.value,
                            })
                          }
                          className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                        />
                      ) : (
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md font-medium">
                          {donation.method}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <select
                          value={editData.status}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              status: e.target.value,
                            })
                          }
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-medium rounded-lg capitalize ${
                            donation.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : donation.status === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {donation.status}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(donation.createdAt).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={saveEdit}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(donation)}
                              className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(donation._id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Donation"
        message="Are you sure you want to delete this donation record? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
