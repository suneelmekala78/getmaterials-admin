import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  material: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    material: { type: Schema.Types.ObjectId, ref: "Material", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, minlength: 3, maxlength: 1000 },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One review per user per material
ReviewSchema.index({ material: 1, user: 1 }, { unique: true });
ReviewSchema.index({ material: 1, isApproved: 1, createdAt: -1 });
ReviewSchema.index({ user: 1 });

export const Review =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
