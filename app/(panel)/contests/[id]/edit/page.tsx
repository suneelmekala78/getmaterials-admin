"use client";

import { useParams } from "next/navigation";
import ContestForm from "@/components/ContestForm";

export default function EditContestPage() {
  const { id } = useParams();
  const contestId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
  return <ContestForm contestId={contestId} />;
}
