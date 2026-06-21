import mongoose, { Schema, Document } from "mongoose";

export interface IMaterialView extends Document {
  material: mongoose.Types.ObjectId;
  viewer: string; // userId or hashed IP
  date: string; // YYYY-MM-DD for daily deduplication
  createdAt: Date;
}

const MaterialViewSchema = new Schema<IMaterialView>(
  {
    material: { type: Schema.Types.ObjectId, ref: "Material", required: true },
    viewer: { type: String, required: true },
    date: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Unique index: one view per viewer per material per day
MaterialViewSchema.index({ material: 1, viewer: 1, date: 1 }, { unique: true });
// For cleanup queries
MaterialViewSchema.index({ createdAt: 1 });

export const MaterialView =
  mongoose.models.MaterialView || mongoose.model<IMaterialView>("MaterialView", MaterialViewSchema);
