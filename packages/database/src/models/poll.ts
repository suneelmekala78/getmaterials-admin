import mongoose, { Schema, Document } from "mongoose";

export interface IPoll extends Document {
  question: string;
  description?: string;
  type: "rating" | "yes_no" | "multiple_choice" | "text";
  options?: string[];
  responses: {
    user: mongoose.Types.ObjectId;
    answer: string;
    createdAt: Date;
  }[];
  isActive: boolean;
  createdAt: Date;
}

const PollSchema = new Schema<IPoll>(
  {
    question: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 500 },
    type: {
      type: String,
      enum: ["rating", "yes_no", "multiple_choice", "text"],
      required: true,
    },
    options: [{ type: String }],
    responses: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        answer: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PollSchema.index({ isActive: 1, createdAt: -1 });

export const Poll =
  mongoose.models.Poll || mongoose.model<IPoll>("Poll", PollSchema);
