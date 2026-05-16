import { z } from "zod";

// ============ AUTH VALIDATION ============
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["student", "teacher"]),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// ============ MATERIAL VALIDATION ============
const attachmentSchema = z.object({
  type: z.enum(["pdf", "video", "link", "image", "assignment"]),
  fileUrl: z.string().optional(),
  externalUrl: z.string().url("Invalid URL").optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
});

export const createMaterialSchema = z.object({
  title: z.string().min(2, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(["pdf", "video", "link", "image", "assignment"]),
  chapter: z.string().min(1, "Chapter is required"),
  subject: z.string().min(1, "Subject is required"),
  college: z.string().optional(),
  externalUrl: z.string().url("Invalid URL").optional(),
  fileUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  attachments: z.array(attachmentSchema).max(10).optional(),
  tags: z.array(z.string()).max(10).optional(),
  isPublic: z.boolean().default(true),
});

export const updateMaterialSchema = createMaterialSchema.partial();

// ============ SUBJECT VALIDATION ============
export const createSubjectSchema = z.object({
  name: z.string().min(2, "Subject name is required").max(100),
  description: z.string().max(500).optional(),
  category: z.enum([
    "science",
    "arts",
    "engineering",
    "commerce",
    "medical",
    "law",
    "general",
  ]),
});

// ============ CHAPTER VALIDATION ============
export const createChapterSchema = z.object({
  title: z.string().min(2, "Chapter title is required").max(200),
  description: z.string().max(500).optional(),
  subject: z.string().min(1, "Subject is required"),
  order: z.number().int().min(0).optional(),
});

// ============ QUIZ VALIDATION ============
export const createQuizSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(500).optional(),
  chapter: z.string().min(1),
  subject: z.string().min(1),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        options: z.array(z.string().min(1)).min(2).max(6),
        correctAnswer: z.number().int().min(0),
        explanation: z.string().optional(),
      })
    )
    .min(1),
  duration: z.number().int().min(1).max(180),
  passingScore: z.number().int().min(0).max(100),
});

// ============ FEEDBACK VALIDATION ============
export const createFeedbackSchema = z.object({
  material: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// ============ CONTACT VALIDATION ============
export const contactSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(2, "Subject is required").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

// ============ DONATION VALIDATION ============
export const createDonationSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("INR"),
  message: z.string().max(500).optional(),
});

// ============ MATERIAL REQUEST VALIDATION ============
export const createMaterialRequestSchema = z.object({
  subject: z.string().min(1),
  chapter: z.string().optional(),
  description: z.string().min(10).max(500),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type CreateDonationInput = z.infer<typeof createDonationSchema>;
export type CreateMaterialRequestInput = z.infer<typeof createMaterialRequestSchema>;
