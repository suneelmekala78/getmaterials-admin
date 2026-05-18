import mongoose, { Schema, Document } from "mongoose";

export interface ICollegeAssignment extends Document {
  college: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  chapter?: mongoose.Types.ObjectId;
  semester: number;
  unit?: number;
  program: "btech" | "mtech" | "mca" | "bca" | "bsc" | "msc" | "mba" | "bba" | "diploma" | "phd" | "other";
  branch?: string; // e.g., "CSE", "AI", "ECE"
  batchStart: number; // e.g., 2020
  batchEnd: number; // e.g., 2024
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CollegeAssignmentSchema = new Schema<ICollegeAssignment>(
  {
    college: { type: Schema.Types.ObjectId, ref: "College", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    chapter: { type: Schema.Types.ObjectId, ref: "Chapter" },
    semester: { type: Number, required: true, min: 1, max: 10 },
    unit: { type: Number, min: 1, max: 10 },
    program: {
      type: String,
      enum: ["btech", "mtech", "mca", "bca", "bsc", "msc", "mba", "bba", "diploma", "phd", "other"],
      default: "btech",
    },
    branch: { type: String, trim: true },
    batchStart: { type: Number, required: true },
    batchEnd: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// A subject can only be assigned once per college+semester+program+branch+batch combo
CollegeAssignmentSchema.index(
  { college: 1, subject: 1, semester: 1, program: 1, branch: 1, batchStart: 1, batchEnd: 1 },
  { unique: true }
);
CollegeAssignmentSchema.index({ college: 1, semester: 1 });
CollegeAssignmentSchema.index({ subject: 1 });

export const CollegeAssignment =
  mongoose.models.CollegeAssignment ||
  mongoose.model<ICollegeAssignment>("CollegeAssignment", CollegeAssignmentSchema);
