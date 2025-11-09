import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    // ✅ Fix for pdfjs-dist compatibility
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    return config;
  },
  // Configure API routes to handle large file uploads
  experimental: {
    // Increase body size limit for API routes
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
};

export default nextConfig;
