import type { NextConfig } from "next";

// @ts-ignore - these options are valid but may not be typed in next.config.ts
const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
};

export default nextConfig;

