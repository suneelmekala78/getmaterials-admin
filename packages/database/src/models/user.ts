import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  avatar?: string;
  role: "student" | "teacher" | "college_admin" | "admin";
  status: "active" | "pending" | "suspended";
  college?: mongoose.Types.ObjectId;
  bio?: string;
  qualifications?: string;
  bookmarks: mongoose.Types.ObjectId[];
  emailVerified?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    password: { type: String, select: false },
    avatar: { type: String },
    role: {
      type: String,
      enum: ["student", "teacher", "college_admin", "admin"],
      default: "student",
    },
    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active",
    },
    college: { type: Schema.Types.ObjectId, ref: "College" },
    bio: { type: String, maxlength: 500 },
    qualifications: { type: String, maxlength: 500 },
    bookmarks: [{ type: Schema.Types.ObjectId, ref: "Material" }],
    emailVerified: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ college: 1 });

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
