import mongoose, { Schema, Document } from "mongoose";

export interface IFeedback extends Document {
  user: mongoose.Types.ObjectId;
  material: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    material: { type: Schema.Types.ObjectId, ref: "Material", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

FeedbackSchema.index({ material: 1 });
FeedbackSchema.index({ user: 1, material: 1 }, { unique: true });

export const Feedback =
  mongoose.models.Feedback || mongoose.model<IFeedback>("Feedback", FeedbackSchema);

// ============ DONATION ============
export interface IDonation extends Document {
  user?: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  amount: number;
  currency: string;
  method: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  transactionId: string;
  status: "pending" | "completed" | "failed";
  message?: string;
  createdAt: Date;
}

const DonationSchema = new Schema<IDonation>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String },
    email: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    method: { type: String, required: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    transactionId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    message: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

DonationSchema.index({ status: 1 });
DonationSchema.index({ user: 1 });

export const Donation =
  mongoose.models.Donation || mongoose.model<IDonation>("Donation", DonationSchema);

// ============ MATERIAL REQUEST ============
export interface IMaterialRequest extends Document {
  user: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  chapter?: mongoose.Types.ObjectId;
  description: string;
  status: "open" | "in_progress" | "fulfilled" | "closed";
  assignedTo?: mongoose.Types.ObjectId;
  fulfilledBy?: mongoose.Types.ObjectId;
  upvotes: number;
  upvotedBy: mongoose.Types.ObjectId[];
  comments: {
    user: mongoose.Types.ObjectId;
    message: string;
    createdAt: Date;
  }[];
  createdAt: Date;
}

const MaterialRequestSchema = new Schema<IMaterialRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    chapter: { type: Schema.Types.ObjectId, ref: "Chapter" },
    description: { type: String, required: true, minlength: 10, maxlength: 500 },
    status: {
      type: String,
      enum: ["open", "in_progress", "fulfilled", "closed"],
      default: "open",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    fulfilledBy: { type: Schema.Types.ObjectId, ref: "Material" },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, required: true, maxlength: 500 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

MaterialRequestSchema.index({ status: 1, upvotes: -1 });
MaterialRequestSchema.index({ subject: 1 });

export const MaterialRequest =
  mongoose.models.MaterialRequest ||
  mongoose.model<IMaterialRequest>("MaterialRequest", MaterialRequestSchema);
