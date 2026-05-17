export const APP_NAME = "GetMaterials";
export const APP_DESCRIPTION =
  "Free educational platform where teachers share study materials and students learn without searching everywhere.";
export const APP_URL = "https://getmaterials.in";
export const APP_MAIN_URL = "https://app.getmaterials.in";
export const APP_ADMIN_URL = "https://admin.getmaterials.in";

export const BRAND_COLOR = "#7c3aed"; // violet-600
export const BRAND_COLOR_LIGHT = "#a78bfa"; // violet-400
export const BRAND_COLOR_DARK = "#5b21b6"; // violet-800

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const ALLOWED_FILE_TYPES = {
  pdf: ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
};

export const ITEMS_PER_PAGE = 12;
export const MAX_TAGS_PER_MATERIAL = 10;

export const SUBJECT_CATEGORIES = [
  { value: "science", label: "Science" },
  { value: "arts", label: "Arts & Humanities" },
  { value: "engineering", label: "Engineering" },
  { value: "commerce", label: "Commerce & Business" },
  { value: "medical", label: "Medical" },
  { value: "law", label: "Law" },
  { value: "general", label: "General" },
] as const;

export const MATERIAL_TYPES = [
  { value: "pdf", label: "PDF / Notes", icon: "📄" },
  { value: "video", label: "Video", icon: "🎬" },
  { value: "link", label: "External Link", icon: "🔗" },
  { value: "image", label: "Image", icon: "🖼️" },
  { value: "assignment", label: "Assignment", icon: "📝" },
] as const;

export const USER_ROLES = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "college_admin", label: "College Admin" },
  { value: "admin", label: "Admin" },
] as const;
