import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set by the Dockerfile; Amplify builds keep the default output.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Allow CI/local `next build` alongside `next dev` without sharing `.next`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
