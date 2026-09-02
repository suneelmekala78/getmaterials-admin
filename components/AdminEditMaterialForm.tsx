"use client";

import { MaterialForm, type InitialMaterial } from "@/components/MaterialForm";

interface Subject {
  id: string;
  name: string;
  slug: string;
}

interface Chapter {
  id: string;
  title: string;
  subject: string;
}

interface College {
  id: string;
  name: string;
  code: string;
  programs?: { key: string; label: string; durationYears: number; totalSemesters: number }[];
  branches?: { program: string; name: string; sections: string[] }[];
}

export function AdminEditMaterialForm({
  material,
  subjects,
  chapters,
  colleges,
}: {
  material: InitialMaterial & { tags?: unknown };
  subjects: Subject[];
  chapters: Chapter[];
  colleges: College[];
}) {
  return (
    <MaterialForm
      key={material.id}
      subjects={subjects}
      chapters={chapters}
      colleges={colleges.map((college) => ({
        ...college,
        programs: college.programs || [],
        branches: college.branches || [],
      }))}
      userRole="admin"
      successRedirect="/materials"
      initialMaterial={material}
    />
  );
}
