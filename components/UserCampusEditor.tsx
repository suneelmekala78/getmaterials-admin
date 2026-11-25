"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type CollegeOption = { _id: string; name: string; code?: string; logo?: string };
type SubjectOption = { _id?: string; id?: string; name: string };

type StudyProfile = {
  college?: { _id?: string; name?: string; code?: string } | string | null;
  collegeOther?: string;
  program?: string;
  programOther?: string;
  branch?: string;
  branchOther?: string;
  year?: number | null;
  yearOther?: string;
  semester?: number | null;
  semesterOther?: string;
  section?: string;
  sectionOther?: string;
  subjects?: { _id?: string; name?: string }[] | string[];
  subjectOthers?: string[];
  completed?: boolean;
};

function collegeIdOf(value: StudyProfile["college"] | { _id?: string } | string | null | undefined) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return "";
}

function subjectIdsOf(subjects: StudyProfile["subjects"]) {
  if (!Array.isArray(subjects)) return [] as string[];
  return subjects
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && item._id) return String(item._id);
      return "";
    })
    .filter(Boolean);
}

export function UserCampusEditor({
  userId,
  study,
  accountCollege,
  onSaved,
  defaultOpen = false,
}: {
  userId: string;
  study?: StudyProfile | null;
  accountCollege?: { _id?: string; name?: string; code?: string } | string | null;
  onSaved: (payload: any) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [saving, setSaving] = useState(false);
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [collegeId, setCollegeId] = useState("");
  const [collegeOther, setCollegeOther] = useState("");
  const [program, setProgram] = useState("");
  const [programOther, setProgramOther] = useState("");
  const [branch, setBranch] = useState("");
  const [branchOther, setBranchOther] = useState("");
  const [year, setYear] = useState("");
  const [yearOther, setYearOther] = useState("");
  const [semester, setSemester] = useState("");
  const [semesterOther, setSemesterOther] = useState("");
  const [section, setSection] = useState("");
  const [sectionOther, setSectionOther] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [subjectOthers, setSubjectOthers] = useState("");

  useEffect(() => {
    const campusCollege = collegeIdOf(study?.college) || collegeIdOf(accountCollege);
    setCollegeId(campusCollege);
    setCollegeOther(study?.collegeOther || "");
    setProgram(study?.program || "");
    setProgramOther(study?.programOther || "");
    setBranch(study?.branch || "");
    setBranchOther(study?.branchOther || "");
    setYear(study?.year != null ? String(study.year) : "");
    setYearOther(study?.yearOther || "");
    setSemester(study?.semester != null ? String(study.semester) : "");
    setSemesterOther(study?.semesterOther || "");
    setSection(study?.section || "");
    setSectionOther(study?.sectionOther || "");
    setSubjectIds(subjectIdsOf(study?.subjects));
    setSubjectOthers((study?.subjectOthers || []).join(", "));
  }, [study, accountCollege]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch("/api/colleges").then((res) => res.json()),
      fetch("/api/subjects").then((res) => res.json()).catch(() => ({ subjects: [] })),
    ])
      .then(([collegeData, subjectData]) => {
        setColleges(collegeData.colleges || []);
        setSubjects(subjectData.subjects || subjectData || []);
      })
      .catch(() => toast.error("Could not load colleges"));
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/campus`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collegeId,
          collegeOther: collegeId ? "" : collegeOther,
          program,
          programOther,
          branch,
          branchOther,
          year: year ? Number(year) : null,
          yearOther,
          semester: semester ? Number(semester) : null,
          semesterOther,
          section,
          sectionOther,
          subjectIds,
          subjectOthers: subjectOthers
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          completed: Boolean(collegeId || collegeOther.trim()),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update campus");
      onSaved(data);
      toast.success("Campus profile updated");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update campus");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Manage campus</h2>
          <p className="mt-1 text-xs text-slate-500">
            Attach a college after you add it from Suggestions, and update course details.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
        >
          {open ? "Close" : "Edit campus"}
        </button>
      </div>

      {open ? (
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">College</span>
            <select
              value={collegeId}
              onChange={(event) => setCollegeId(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">No college / use custom name</option>
              {colleges.map((college) => (
                <option key={college._id} value={college._id}>
                  {college.name}
                  {college.code ? ` (${college.code})` : ""}
                </option>
              ))}
            </select>
          </label>

          {!collegeId ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Custom college name</span>
              <input
                value={collegeOther}
                onChange={(event) => setCollegeOther(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="Name from the suggestion"
              />
            </label>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Program" value={program} onChange={setProgram} placeholder="btech" />
            <Field label="Program other" value={programOther} onChange={setProgramOther} />
            <Field label="Branch" value={branch} onChange={setBranch} placeholder="CSE" />
            <Field label="Branch other" value={branchOther} onChange={setBranchOther} />
            <Field label="Year" value={year} onChange={setYear} placeholder="1" />
            <Field label="Year other" value={yearOther} onChange={setYearOther} />
            <Field label="Semester" value={semester} onChange={setSemester} placeholder="1" />
            <Field label="Semester other" value={semesterOther} onChange={setSemesterOther} />
            <Field label="Section" value={section} onChange={setSection} placeholder="A" />
            <Field label="Section other" value={sectionOther} onChange={setSectionOther} />
          </div>

          {subjects.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Subjects</p>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
                {subjects.map((subject) => {
                  const id = String(subject._id || subject.id || "");
                  const on = subjectIds.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setSubjectIds((prev) =>
                          on ? prev.filter((item) => item !== id) : [...prev, id],
                        )
                      }
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        on ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {subject.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Other subjects (comma separated)</span>
            <input
              value={subjectOthers}
              onChange={(event) => setSubjectOthers(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save campus"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
      />
    </label>
  );
}
