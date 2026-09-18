"use client";

import { useParams } from "next/navigation";
import QuizForm from "@/components/QuizForm";

export default function EditQuizPage() {
  const { id } = useParams();
  const quizId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
  return <QuizForm quizId={quizId} />;
}
