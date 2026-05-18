import mongoose, { Schema, Document } from "mongoose";

export interface IRoleChangeRequest extends Document {
  user: mongoose.Types.ObjectId;
  fromRole: "student" | "teacher" | "college_admin";
  toRole: "teacher" | "college_admin";
  reason: string;
  qualifications?: string;
  status: "pending" | "approved" | "rejected";
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoleChangeRequestSchema = new Schema<IRoleChangeRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fromRole: {
      type: String,
      enum: ["student", "teacher", "college_admin"],
      required: true,
    },
    toRole: {
      type: String,
      enum: ["teacher", "college_admin"],
      required: true,
    },
    reason: { type: String, required: true, maxlength: 1000, trim: true },
    qualifications: { type: String, maxlength: 500, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    processedBy: { type: Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },
    adminNote: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

RoleChangeRequestSchema.index({ user: 1, status: 1 });
RoleChangeRequestSchema.index({ status: 1, createdAt: -1 });

export const RoleChangeRequest =
  mongoose.models.RoleChangeRequest ||
  mongoose.model<IRoleChangeRequest>("RoleChangeRequest", RoleChangeRequestSchema);
