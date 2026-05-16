import mongoose, { Schema, Document } from "mongoose";

export interface IQuiz extends Document {
  title: string;
  description?: string;
  chapter: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }[];
  duration: number;
  passingScore: number;
  attempts: number;
  isActive: boolean;
  createdAt: Date;
}

const QuizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 500 },
    chapter: { type: Schema.Types.ObjectId, ref: "Chapter", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    questions: [
      {
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: Number, required: true },
        explanation: { type: String },
      },
    ],
    duration: { type: Number, required: true, min: 1 },
    passingScore: { type: Number, required: true, min: 0, max: 100 },
    attempts: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

QuizSchema.index({ subject: 1, chapter: 1 });
QuizSchema.index({ createdBy: 1 });

export const Quiz =
  mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);

// ============ QUIZ ATTEMPT ============
export interface IQuizAttempt extends Document {
  quiz: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  answers: number[];
  score: number;
  completedAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>({
  quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  answers: [{ type: Number }],
  score: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now },
});

QuizAttemptSchema.index({ quiz: 1, user: 1 });
QuizAttemptSchema.index({ user: 1 });

export const QuizAttempt =
  mongoose.models.QuizAttempt ||
  mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);
