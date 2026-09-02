"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Trash2, MapPin, Pencil, X, ChevronDown, ChevronRight, GraduationCap, GitBranch, Calendar, ImagePlus } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import toast from "react-hot-toast";

interface CollegeProgram {
  key: string;
  label: string;
  durationYears: number;
  totalSemesters: number;
}

interface CollegeBranch {
  program: string;
  name: string;
  sections: string[];
}

interface CollegeBatch {
  program: string;
  branch?: string;
  startYear: number;
  endYear: number;
}

interface College {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  banner?: string;
  location?: string;
  description?: string;
  status: string;
  programs: CollegeProgram[];
  branches: CollegeBranch[];
  batches: CollegeBatch[];
}

export default function AdminCollegesPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [removingItem, setRemovingItem] = useState<string | null>(null);
  const [expandedCollege, setExpandedCollege] = useState<string | null>(null);

  // College form
  const [form, setForm] = useState({ name: "", code: "", location: "", description: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [clearLogo, setClearLogo] = useState(false);
  const [clearBanner, setClearBanner] = useState(false);

  // Program form
  const [showProgramForm, setShowProgramForm] = useState<string | null>(null);
  const [programForm, setProgramForm] = useState({ key: "", label: "", durationYears: 4, totalSemesters: 8 });

  // Branch form
  const [showBranchForm, setShowBranchForm] = useState<string | null>(null);
  const [branchForm, setBranchForm] = useState({ program: "", name: "", sections: "" });

  // Batch form
  const [showBatchForm, setShowBatchForm] = useState<string | null>(null);
  const [batchForm, setBatchForm] = useState({ program: "", branch: "", startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 4 });

  useEffect(() => { fetchColleges(); }, []);

  const fetchColleges = async () => {
    try {
      const res = await fetch("/api/colleges");
      const data = await res.json();
      setColleges(data.colleges || []);
    } catch {
      toast.error("Failed to load colleges");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", code: "", location: "", description: "" });
    setLogoFile(null);
    setBannerFile(null);
    setLogoPreview("");
    setBannerPreview("");
    setClearLogo(false);
    setClearBanner(false);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (c: College) => {
    setEditingId(c._id);
    setForm({ name: c.name, code: c.code, location: c.location || "", description: c.description || "" });
    setLogoFile(null);
    setBannerFile(null);
    setLogoPreview(c.logo || "");
    setBannerPreview(c.banner || "");
    setClearLogo(false);
    setClearBanner(false);
    setShowForm(true);
  };

  const pickImage = (kind: "logo" | "banner", file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (kind === "logo") {
      setLogoFile(file);
      setLogoPreview(url);
      setClearLogo(false);
    } else {
      setBannerFile(file);
      setBannerPreview(url);
      setClearBanner(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = new FormData();
      body.append("name", form.name);
      body.append("code", form.code);
      body.append("location", form.location);
      body.append("description", form.description);
      if (editingId) body.append("id", editingId);
      if (logoFile) body.append("logo", logoFile);
      if (bannerFile) body.append("banner", bannerFile);
      if (clearLogo) body.append("clearLogo", "true");
      if (clearBanner) body.append("clearBanner", "true");

      const res = await fetch("/api/colleges", {
        method: editingId ? "PATCH" : "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editingId ? "College updated" : "College created");
      resetForm();
      fetchColleges();
    } catch (err: any) {
      toast.error(err.message || "Failed to save college");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/colleges", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId }),
      });
      if (res.ok) {
        setColleges((prev) => prev.filter((c) => c._id !== deleteId));
        toast.success("College deleted");
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteId(null);
      setDeleting(false);
    }
  };

  // Program management
  const handleAddProgram = async (collegeId: string) => {
    if (!programForm.key || !programForm.label) return;
    try {
      const res = await fetch(`/api/colleges/programs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId, ...programForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Program added");
      setShowProgramForm(null);
      setProgramForm({ key: "", label: "", durationYears: 4, totalSemesters: 8 });
      fetchColleges();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRemoveProgram = async (collegeId: string, programKey: string) => {
    setRemovingItem(`program-${programKey}`);
    try {
      const res = await fetch(`/api/colleges/programs`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId, programKey }),
      });
      if (res.ok) {
        toast.success("Program removed");
        fetchColleges();
      }
    } catch {
      toast.error("Failed to remove program");
    } finally {
      setRemovingItem(null);
    }
  };

  // Branch management
  const handleAddBranch = async (collegeId: string) => {
    if (!branchForm.program || !branchForm.name) return;
    try {
      const sections = branchForm.sections.split(",").map(s => s.trim()).filter(Boolean);
      const res = await fetch(`/api/colleges/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId, program: branchForm.program, name: branchForm.name, sections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Branch added");
      setShowBranchForm(null);
      setBranchForm({ program: "", name: "", sections: "" });
      fetchColleges();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRemoveBranch = async (collegeId: string, program: string, branchName: string) => {
    setRemovingItem(`branch-${program}-${branchName}`);
    try {
      const res = await fetch(`/api/colleges/branches`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId, program, name: branchName }),
      });
      if (res.ok) {
        toast.success("Branch removed");
        fetchColleges();
      }
    } catch {
      toast.error("Failed to remove branch");
    } finally {
      setRemovingItem(null);
    }
  };

  // Batch management
  const handleAddBatch = async (collegeId: string) => {
    if (!batchForm.program || !batchForm.startYear || !batchForm.endYear) return;
    try {
      const res = await fetch(`/api/colleges/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId, ...batchForm, branch: batchForm.branch || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Batch added");
      setShowBatchForm(null);
      setBatchForm({ program: "", branch: "", startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 4 });
      fetchColleges();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRemoveBatch = async (collegeId: string, program: string, startYear: number, endYear: number) => {
    setRemovingItem(`batch-${program}-${startYear}-${endYear}`);
    try {
      const res = await fetch(`/api/colleges/batches`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId, program, startYear, endYear }),
      });
      if (res.ok) {
        toast.success("Batch removed");
        fetchColleges();
      }
    } catch {
      toast.error("Failed to remove batch");
    } finally {
      setRemovingItem(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Colleges</h1>
          <p className="text-slate-500 mt-1">Manage colleges, programs, branches, sections & batches.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white font-medium text-sm rounded-xl hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add College
        </button>
      </div>

      {/* Add/Edit college form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">{editingId ? "Edit College" : "Add New College"}</h2>
            <button onClick={resetForm} className="p-1 text-slate-400 hover:text-slate-600 rounded"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="College name" required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Code *</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g., NIT-W" required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, State" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo</label>
                <p className="text-xs text-slate-400 mb-2">Square mark, shown on college cards. PNG or JPG, up to 5 MB.</p>
                <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-dashed border-slate-200 px-3 py-3 hover:bg-slate-50">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                    {logoPreview && !clearLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview} alt="" className="w-full h-full object-contain bg-white" />
                    ) : (
                      <ImagePlus className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <span className="text-sm text-slate-600">{logoFile?.name || "Choose logo"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => pickImage("logo", e.target.files?.[0])}
                  />
                </label>
                {logoPreview && !clearLogo ? (
                  <button
                    type="button"
                    onClick={() => { setLogoFile(null); setLogoPreview(""); setClearLogo(true); }}
                    className="mt-2 text-xs text-red-500 hover:underline"
                  >
                    Remove logo
                  </button>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Banner</label>
                <p className="text-xs text-slate-400 mb-2">Wide cover, about 16:9. PNG or JPG, up to 5 MB.</p>
                <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-dashed border-slate-200 px-3 py-3 hover:bg-slate-50">
                  <div className="w-24 h-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                    {bannerPreview && !clearBanner ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImagePlus className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <span className="text-sm text-slate-600">{bannerFile?.name || "Choose banner"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => pickImage("banner", e.target.files?.[0])}
                  />
                </label>
                {bannerPreview && !clearBanner ? (
                  <button
                    type="button"
                    onClick={() => { setBannerFile(null); setBannerPreview(""); setClearBanner(true); }}
                    className="mt-2 text-xs text-red-500 hover:underline"
                  >
                    Remove banner
                  </button>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className="px-5 py-2.5 bg-violet-600 text-white font-medium text-sm rounded-xl hover:bg-violet-700 transition-colors">
                {editingId ? "Update College" : "Save College"}
              </button>
              <button type="button" onClick={resetForm} className="px-5 py-2.5 text-slate-600 font-medium text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Colleges list as expandable cards */}
      {colleges.length > 0 ? (
        <div className="space-y-4">
          {colleges.map((college) => {
            const isExpanded = expandedCollege === college._id;
            return (
              <div key={college._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* College Header */}
                <div className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50/50" onClick={() => setExpandedCollege(isExpanded ? null : college._id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-violet-50 rounded-xl overflow-hidden flex items-center justify-center">
                      {college.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={college.logo} alt="" className="w-full h-full object-contain bg-white" />
                      ) : (
                        <Building2 className="w-5 h-5 text-violet-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{college.name}</h3>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{college.code}</span>
                        {college.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{college.location}</span>}
                        <span>{college.programs?.length || 0} programs</span>
                        <span>{college.branches?.length || 0} branches</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(college); }} className="p-2 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-violet-50 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(college._id); }} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-6 py-5 space-y-6">
                    {/* Programs Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-violet-500" /> Programs
                        </h4>
                        <button onClick={() => setShowProgramForm(showProgramForm === college._id ? null : college._id)} className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add Program
                        </button>
                      </div>
                      {showProgramForm === college._id && (
                        <div className="bg-slate-50 rounded-xl p-4 mb-3 space-y-3">
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <input type="text" value={programForm.key} onChange={(e) => setProgramForm({ ...programForm, key: e.target.value })} placeholder="Key (e.g., btech)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" />
                            <input type="text" value={programForm.label} onChange={(e) => setProgramForm({ ...programForm, label: e.target.value })} placeholder="Label (e.g., B.Tech)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" />
                            <input type="number" value={programForm.durationYears} onChange={(e) => setProgramForm({ ...programForm, durationYears: parseInt(e.target.value) || 4 })} placeholder="Years" min={1} max={10} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" />
                            <input type="number" value={programForm.totalSemesters} onChange={(e) => setProgramForm({ ...programForm, totalSemesters: parseInt(e.target.value) || 8 })} placeholder="Semesters" min={1} max={20} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" />
                          </div>
                          <button onClick={() => handleAddProgram(college._id)} className="px-4 py-2 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700">Add</button>
                        </div>
                      )}
                      {college.programs?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {college.programs.map((p) => (
                            <div key={p.key} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-slate-800">{p.label}</p>
                                <p className="text-xs text-slate-500">{p.durationYears} years • {p.totalSemesters} semesters</p>
                              </div>
                              <button onClick={() => handleRemoveProgram(college._id, p.key)} disabled={removingItem === `program-${p.key}`} className="p-1 text-slate-400 hover:text-red-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{removingItem === `program-${p.key}` ? <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin inline-block" /> : <Trash2 className="w-3.5 h-3.5" />}</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No programs added yet</p>
                      )}
                    </div>

                    {/* Branches & Sections */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-emerald-500" /> Branches & Sections
                        </h4>
                        <button onClick={() => setShowBranchForm(showBranchForm === college._id ? null : college._id)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add Branch
                        </button>
                      </div>
                      {showBranchForm === college._id && (
                        <div className="bg-slate-50 rounded-xl p-4 mb-3 space-y-3">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            <select value={branchForm.program} onChange={(e) => setBranchForm({ ...branchForm, program: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500 cursor-pointer">
                              <option value="">Select Program</option>
                              {college.programs?.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                            </select>
                            <input type="text" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} placeholder="Branch (e.g., CSE)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" />
                            <input type="text" value={branchForm.sections} onChange={(e) => setBranchForm({ ...branchForm, sections: e.target.value })} placeholder="Sections (e.g., A, B, C)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" />
                          </div>
                          <button onClick={() => handleAddBranch(college._id)} className="px-4 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700">Add</button>
                        </div>
                      )}
                      {college.branches?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {college.branches.map((b, i) => (
                            <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-slate-800">{b.name} <span className="text-xs text-slate-400">({b.program})</span></p>
                                {b.sections?.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {b.sections.map((s) => (
                                      <span key={s} className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">{s}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button onClick={() => handleRemoveBranch(college._id, b.program, b.name)} disabled={removingItem === `branch-${b.program}-${b.name}`} className="p-1 text-slate-400 hover:text-red-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{removingItem === `branch-${b.program}-${b.name}` ? <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin inline-block" /> : <Trash2 className="w-3.5 h-3.5" />}</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No branches added yet</p>
                      )}
                    </div>

                    {/* Batches */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-500" /> Batches
                        </h4>
                        <button onClick={() => setShowBatchForm(showBatchForm === college._id ? null : college._id)} className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add Batch
                        </button>
                      </div>
                      {showBatchForm === college._id && (
                        <div className="bg-slate-50 rounded-xl p-4 mb-3 space-y-3">
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <select value={batchForm.program} onChange={(e) => setBatchForm({ ...batchForm, program: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500 cursor-pointer">
                              <option value="">Select Program</option>
                              {college.programs?.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                            </select>
                            <select value={batchForm.branch} onChange={(e) => setBatchForm({ ...batchForm, branch: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500 cursor-pointer">
                              <option value="">All Branches</option>
                              {college.branches?.filter(b => b.program === batchForm.program).map((b, i) => <option key={i} value={b.name}>{b.name}</option>)}
                            </select>
                            <input type="number" value={batchForm.startYear} onChange={(e) => setBatchForm({ ...batchForm, startYear: parseInt(e.target.value) })} placeholder="Start Year" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" />
                            <input type="number" value={batchForm.endYear} onChange={(e) => setBatchForm({ ...batchForm, endYear: parseInt(e.target.value) })} placeholder="End Year" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" />
                          </div>
                          <button onClick={() => handleAddBatch(college._id)} className="px-4 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700">Add</button>
                        </div>
                      )}
                      {college.batches?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {college.batches.map((b, i) => (
                            <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                              <span className="text-xs text-slate-600">{b.program}{b.branch ? ` / ${b.branch}` : ""} — {b.startYear}–{b.endYear}</span>
                              <button onClick={() => handleRemoveBatch(college._id, b.program, b.startYear, b.endYear)} disabled={removingItem === `batch-${b.program}-${b.startYear}-${b.endYear}`} className="p-0.5 text-slate-400 hover:text-red-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{removingItem === `batch-${b.program}-${b.startYear}-${b.endYear}` ? <span className="w-3 h-3 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin inline-block" /> : <X className="w-3 h-3" />}</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No batches added yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No colleges added yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Add educational institutions to organize materials by college, programs, branches, and sections.
          </p>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete College"
        message="Are you sure you want to delete this college? This will also remove all associated programs, branches, and batches."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
