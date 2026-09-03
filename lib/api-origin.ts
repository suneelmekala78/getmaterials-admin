const PRODUCTION_API = "https://api.getmaterials.in";

/** Express origin used by the Next.js BFF. Never fall back to localhost in prod. */
export function resolveApiOrigin() {
  const fromEnv = (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/$/, "");
  if (fromEnv && !(process.env.NODE_ENV === "production" && /localhost|127\.0\.0\.1/.test(fromEnv))) {
    return fromEnv;
  }
  if (process.env.NODE_ENV === "production") return PRODUCTION_API;
  return fromEnv || "http://localhost:4000";
}
