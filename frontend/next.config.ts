import type { NextConfig } from "next";

// @ts-ignore - these options are valid but may not be typed in next.config.ts
const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  async redirects() {
    return [
      { source: '/dashboard', destination: '/subjects', permanent: true },
    ];
  },
};

export default nextConfig;

