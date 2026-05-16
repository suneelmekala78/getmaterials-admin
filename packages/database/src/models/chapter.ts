import mongoose, { Schema, Document } from "mongoose";

export interface IChapter extends Document {
  title: string;
  slug: string;
  description?: string;
  order: number;
  subject: mongoose.Types.ObjectId;
  materialsCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ChapterSchema = new Schema<IChapter>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    description: { type: String, maxlength: 500 },
    order: { type: Number, default: 0 },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    materialsCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ChapterSchema.index({ subject: 1, order: 1 });
ChapterSchema.index({ slug: 1, subject: 1 }, { unique: true });

export const Chapter =
  mongoose.models.Chapter || mongoose.model<IChapter>("Chapter", ChapterSchema);
