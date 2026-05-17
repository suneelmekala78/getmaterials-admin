import mongoose, { Schema, Document } from "mongoose";

export interface IAttachment {
  type: "pdf" | "video" | "link" | "image" | "assignment";
  fileUrl?: string;
  externalUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface IMaterial extends Document {
  title: string;
  description?: string;
  slug: string;
  type: "pdf" | "video" | "link" | "image" | "assignment";
  materialCategory: "notes" | "question_paper" | "syllabus" | "assignment" | "lab_manual" | "reference" | "other";
  program: "btech" | "mtech" | "mca" | "bca" | "bsc" | "msc" | "mba" | "bba" | "diploma" | "phd" | "other";
  chapter: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  college?: mongoose.Types.ObjectId;
  fileUrl?: string;
  externalUrl?: string;
  thumbnailUrl?: string;
  fileSize?: number;
  mimeType?: string;
  attachments: IAttachment[];
  tags: string[];
  views: number;
  downloads: number;
  rating: {
    average: number;
    count: number;
  };
  status: "published" | "draft" | "under_review";
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema = new Schema<IMaterial>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 1000 },
    slug: { type: String, required: true, lowercase: true },
    type: {
      type: String,
      enum: ["pdf", "video", "link", "image", "assignment"],
      required: true,
    },
    materialCategory: {
      type: String,
      enum: ["notes", "question_paper", "syllabus", "assignment", "lab_manual", "reference", "other"],
      default: "notes",
    },
    program: {
      type: String,
      enum: ["btech", "mtech", "mca", "bca", "bsc", "msc", "mba", "bba", "diploma", "phd", "other"],
      default: "btech",
    },
    chapter: { type: Schema.Types.ObjectId, ref: "Chapter", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    college: { type: Schema.Types.ObjectId, ref: "College" },
    fileUrl: { type: String },
    externalUrl: { type: String },
    thumbnailUrl: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    attachments: [
      {
        type: {
          type: String,
          enum: ["pdf", "video", "link", "image", "assignment"],
          required: true,
        },
        fileUrl: { type: String },
        externalUrl: { type: String },
        fileName: { type: String },
        fileSize: { type: Number },
        mimeType: { type: String },
      },
    ],
    tags: [{ type: String, lowercase: true, trim: true }],
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["published", "draft", "under_review"],
      default: "published",
    },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MaterialSchema.index({ subject: 1, chapter: 1, status: 1 });
MaterialSchema.index({ uploadedBy: 1 });
MaterialSchema.index({ type: 1, status: 1 });
MaterialSchema.index({ tags: 1 });
MaterialSchema.index({ slug: 1 }, { unique: true });
MaterialSchema.index({ title: "text", description: "text", tags: "text" });

export const Material =
  mongoose.models.Material || mongoose.model<IMaterial>("Material", MaterialSchema);
