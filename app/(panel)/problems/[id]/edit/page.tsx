"use client";

import { useParams } from "next/navigation";
import PracticeProblemForm from "@/components/PracticeProblemForm";

export default function EditProblemPage() {
  const { id } = useParams();
  const problemId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
  return <PracticeProblemForm problemId={problemId} />;
}
