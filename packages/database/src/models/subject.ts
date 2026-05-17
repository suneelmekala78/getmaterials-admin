import mongoose, { Schema, Document } from "mongoose";

export interface ISubject extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  banner?: string;
  category: "science" | "arts" | "engineering" | "commerce" | "medical" | "law" | "general";
  isActive: boolean;
  materialsCount: number;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, maxlength: 500 },
    icon: { type: String },
    banner: { type: String },
    category: {
      type: String,
      enum: ["science", "arts", "engineering", "commerce", "medical", "law", "general"],
      default: "general",
    },
    isActive: { type: Boolean, default: true },
    materialsCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

SubjectSchema.index({ category: 1, isActive: 1 });

export const Subject =
  mongoose.models.Subject || mongoose.model<ISubject>("Subject", SubjectSchema);
