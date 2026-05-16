import mongoose, { Schema, Document } from "mongoose";

export interface ICollege extends Document {
  name: string;
  code: string;
  logo?: string;
  location?: string;
  description?: string;
  adminUsers: mongoose.Types.ObjectId[];
  status: "active" | "inactive";
  createdAt: Date;
}

const CollegeSchema = new Schema<ICollege>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    logo: { type: String },
    location: { type: String },
    description: { type: String, maxlength: 1000 },
    adminUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

CollegeSchema.index({ status: 1 });

export const College =
  mongoose.models.College || mongoose.model<ICollege>("College", CollegeSchema);
