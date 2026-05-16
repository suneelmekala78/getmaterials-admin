"use client";

import { useState, useEffect } from "react";
import { HiOutlineStar, HiOutlineTrash, HiOutlineCheck, HiOutlineBan } from "react-icons/hi";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Review {
  _id: string;
  user: { name: string; email: string; avatar?: string };
  material: { title: string; slug: string };
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "hidden">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => setReviews(data.reviews || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleApproval = async (id: string, isApproved: boolean) => {
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isApproved }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r._id === id ? { ...r, isApproved } : r))
        );
      }
    } catch {
      // Handle error
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/reviews?id=${deleteId}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r._id !== deleteId));
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = filter === "all"
    ? reviews
    : filter === "approved"
      ? reviews.filter((r) => r.isApproved)
      : reviews.filter((r) => !r.isApproved);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reviews & Ratings</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage user reviews on materials. Hide inappropriate reviews.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200">
          <HiOutlineStar className="w-4 h-4 text-amber-500" />
          <span className="font-medium">{reviews.length} total</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "approved", "hidden"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === tab
                ? "bg-violet-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-violet-300"
            }`}
          >
            {tab} ({tab === "all" ? reviews.length : tab === "approved" ? reviews.filter((r) => r.isApproved).length : reviews.filter((r) => !r.isApproved).length})
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <HiOutlineStar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No reviews found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <div
              key={review._id}
              className={`bg-white rounded-xl border p-5 ${review.isApproved ? "border-slate-100" : "border-red-100 bg-red-50/30"}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {review.user?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">{review.user?.name}</span>
                    <span className="text-xs text-slate-400">{review.user?.email}</span>
                    {!review.isApproved && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-600 rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <HiOutlineStar
                        key={star}
                        className={`w-4 h-4 ${star <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                      />
                    ))}
                    <span className="text-xs text-slate-400 ml-2">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{review.comment}</p>
                  <p className="text-xs text-violet-600 mt-1 font-medium">
                    on: {review.material?.title || "Unknown material"}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {review.isApproved ? (
                    <button
                      onClick={() => toggleApproval(review._id, false)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Hide review"
                    >
                      <HiOutlineBan className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleApproval(review._id, true)}
                      className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                      title="Approve review"
                    >
                      <HiOutlineCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteId(review._id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete review"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Review"
        message="Are you sure? This review will be permanently deleted."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
