import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
  images: {
    remotePatterns: [{ hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
