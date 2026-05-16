import mongoose, { Schema, Document } from "mongoose";

export interface IContactMessage extends Document {
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: "new" | "read" | "replied";
  createdAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, trim: true },
    message: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ["new", "read", "replied"], default: "new" },
  },
  { timestamps: true }
);

ContactMessageSchema.index({ status: 1, createdAt: -1 });

export const ContactMessage =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);

// ============ SITE FEEDBACK (public, no auth required) ============
export interface ISiteFeedback extends Document {
  name: string;
  rating: number;
  message: string;
  isApproved: boolean;
  createdAt: Date;
}

const SiteFeedbackSchema = new Schema<ISiteFeedback>(
  {
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true, maxlength: 1000 },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SiteFeedbackSchema.index({ isApproved: 1, createdAt: -1 });

export const SiteFeedback =
  mongoose.models.SiteFeedback ||
  mongoose.model<ISiteFeedback>("SiteFeedback", SiteFeedbackSchema);
