const PRODUCTION_API = "https://api.getmaterials.in";

/** Amplify SSR may not set NODE_ENV=production; never treat those hosts as local. */
export function isHostedProduction() {
  if (process.env.NODE_ENV === "production") return true;
  const hostedUrl =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.AMPLIFY_URL ||
    "";
  if (/getmaterials\.in|amplifyapp\.com/i.test(hostedUrl)) return true;
  if (process.env.AWS_EXECUTION_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return true;
  }
  return false;
}

/** Express origin used by the Next.js BFF. Never fall back to localhost in prod. */
export function resolveApiOrigin() {
  const fromEnv = (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/$/, "");
  const hosted = isHostedProduction();
  if (fromEnv && !(hosted && /localhost|127\.0\.0\.1/.test(fromEnv))) {
    return fromEnv;
  }
  if (hosted) return PRODUCTION_API;
  return fromEnv || "http://localhost:4000";
}
