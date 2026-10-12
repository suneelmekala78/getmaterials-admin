import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set by the Dockerfile; Amplify builds keep the default output.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
};

export default nextConfig;
