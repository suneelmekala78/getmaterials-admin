import { z } from "zod";

// ============ USER ============
export const UserRole = z.enum(["student", "teacher", "college_admin", "admin"]);
export type UserRole = z.infer<typeof UserRole>;

export const UserStatus = z.enum(["active", "pending", "suspended"]);
export type UserStatus = z.infer<typeof UserStatus>;

export const UserSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  avatar: z.string().url().optional(),
  role: UserRole,
  status: UserStatus,
  college: z.string().optional(),
  bio: z.string().max(500).optional(),
  qualifications: z.string().max(500).optional(),
  bookmarks: z.array(z.string()).default([]),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type User = z.infer<typeof UserSchema>;

// ============ COLLEGE ============
export const CollegeSchema = z.object({
  _id: z.string(),
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(20),
  logo: z.string().url().optional(),
  location: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  adminUsers: z.array(z.string()).default([]),
  status: z.enum(["active", "inactive"]),
  createdAt: z.string().or(z.date()),
});
export type College = z.infer<typeof CollegeSchema>;

// ============ SUBJECT ============
export const SubjectCategory = z.enum([
  "science",
  "arts",
  "engineering",
  "commerce",
  "medical",
  "law",
  "general",
]);
export type SubjectCategory = z.infer<typeof SubjectCategory>;

export const SubjectSchema = z.object({
  _id: z.string(),
  name: z.string().min(2).max(100),
  slug: z.string(),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  banner: z.string().optional(),
  category: SubjectCategory,
  isActive: z.boolean().default(true),
  createdBy: z.string(),
  createdAt: z.string().or(z.date()),
});
export type Subject = z.infer<typeof SubjectSchema>;

// ============ CHAPTER ============
export const ChapterSchema = z.object({
  _id: z.string(),
  title: z.string().min(2).max(200),
  slug: z.string(),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0),
  subject: z.string(),
  createdBy: z.string(),
  createdAt: z.string().or(z.date()),
});
export type Chapter = z.infer<typeof ChapterSchema>;

// ============ MATERIAL ============
export const MaterialType = z.enum([
  "pdf",
  "video",
  "link",
  "image",
  "assignment",
]);
export type MaterialType = z.infer<typeof MaterialType>;

export const MaterialStatus = z.enum(["published", "draft", "under_review"]);
export type MaterialStatus = z.infer<typeof MaterialStatus>;

export const MaterialSchema = z.object({
  _id: z.string(),
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  slug: z.string(),
  type: MaterialType,
  chapter: z.string(),
  subject: z.string(),
  uploadedBy: z.string(),
  college: z.string().optional(),
  fileUrl: z.string().optional(),
  externalUrl: z.string().url().optional(),
  thumbnailUrl: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  tags: z.array(z.string()).default([]),
  views: z.number().default(0),
  downloads: z.number().default(0),
  rating: z
    .object({
      average: z.number().min(0).max(5).default(0),
      count: z.number().default(0),
    })
    .default({ average: 0, count: 0 }),
  status: MaterialStatus.default("published"),
  isPublic: z.boolean().default(true),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type Material = z.infer<typeof MaterialSchema>;

// ============ QUIZ ============
export const QuizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2).max(6),
  correctAnswer: z.number().int().min(0),
  explanation: z.string().optional(),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const QuizSchema = z.object({
  _id: z.string(),
  title: z.string().min(2).max(200),
  description: z.string().max(500).optional(),
  chapter: z.string(),
  subject: z.string(),
  createdBy: z.string(),
  questions: z.array(QuizQuestionSchema).min(1),
  duration: z.number().int().min(1),
  passingScore: z.number().int().min(0).max(100),
  attempts: z.number().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().or(z.date()),
});
export type Quiz = z.infer<typeof QuizSchema>;

// ============ QUIZ ATTEMPT ============
export const QuizAttemptSchema = z.object({
  _id: z.string(),
  quiz: z.string(),
  user: z.string(),
  answers: z.array(z.number()),
  score: z.number(),
  completedAt: z.string().or(z.date()),
});
export type QuizAttempt = z.infer<typeof QuizAttemptSchema>;

// ============ FEEDBACK ============
export const FeedbackSchema = z.object({
  _id: z.string(),
  user: z.string(),
  material: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  createdAt: z.string().or(z.date()),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

// ============ DONATION ============
export const DonationSchema = z.object({
  _id: z.string(),
  user: z.string().optional(),
  name: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default("INR"),
  method: z.string(),
  transactionId: z.string(),
  status: z.enum(["pending", "completed", "failed"]),
  message: z.string().max(500).optional(),
  createdAt: z.string().or(z.date()),
});
export type Donation = z.infer<typeof DonationSchema>;

// ============ MATERIAL REQUEST ============
export const MaterialRequestSchema = z.object({
  _id: z.string(),
  user: z.string(),
  subject: z.string(),
  chapter: z.string().optional(),
  description: z.string().min(10).max(500),
  status: z.enum(["open", "fulfilled", "closed"]),
  fulfilledBy: z.string().optional(),
  upvotes: z.number().default(0),
  upvotedBy: z.array(z.string()).default([]),
  createdAt: z.string().or(z.date()),
});
export type MaterialRequest = z.infer<typeof MaterialRequestSchema>;
