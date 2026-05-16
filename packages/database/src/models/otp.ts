import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

OtpSchema.index({ email: 1, code: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp =
  mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);
