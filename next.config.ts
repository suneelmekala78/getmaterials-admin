import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@getmaterials/ui", "@getmaterials/shared", "@getmaterials/database"],
};

export default nextConfig;
