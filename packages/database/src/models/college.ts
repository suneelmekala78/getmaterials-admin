import mongoose, { Schema, Document } from "mongoose";

export interface ICollegeProgram {
  key: string;
  label: string;
  durationYears: number;
  totalSemesters: number;
}

export interface ICollegeBranch {
  program: string;
  name: string;
  sections: string[];
}

export interface ICollegeBatch {
  program: string;
  branch?: string;
  startYear: number;
  endYear: number;
}

export interface ICollege extends Document {
  name: string;
  code: string;
  logo?: string;
  location?: string;
  description?: string;
  adminUsers: mongoose.Types.ObjectId[];
  status: "active" | "inactive";
  programs: ICollegeProgram[];
  branches: ICollegeBranch[];
  batches: ICollegeBatch[];
  createdAt: Date;
  updatedAt: Date;
}

const CollegeProgramSchema = new Schema<ICollegeProgram>(
  {
    key: { type: String, required: true, lowercase: true, trim: true },
    label: { type: String, required: true, trim: true },
    durationYears: { type: Number, required: true, min: 1, max: 10 },
    totalSemesters: { type: Number, required: true, min: 1, max: 20 },
  },
  { _id: false }
);

const CollegeBranchSchema = new Schema<ICollegeBranch>(
  {
    program: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true, uppercase: true },
    sections: [{ type: String, trim: true, uppercase: true }],
  },
  { _id: false }
);

const CollegeBatchSchema = new Schema<ICollegeBatch>(
  {
    program: { type: String, required: true, lowercase: true, trim: true },
    branch: { type: String, trim: true, uppercase: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
  },
  { _id: false }
);

const CollegeSchema = new Schema<ICollege>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    logo: { type: String },
    location: { type: String },
    description: { type: String, maxlength: 1000 },
    adminUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    programs: { type: [CollegeProgramSchema], default: [] },
    branches: { type: [CollegeBranchSchema], default: [] },
    batches: { type: [CollegeBatchSchema], default: [] },
  },
  { timestamps: true }
);

CollegeSchema.index({ status: 1 });

export const College =
  mongoose.models.College || mongoose.model<ICollege>("College", CollegeSchema);
