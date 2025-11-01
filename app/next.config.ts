import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Disable aggressive caching to prevent stale data issues
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

export default nextConfig;
