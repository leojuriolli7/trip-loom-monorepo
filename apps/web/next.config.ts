import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
  images: {
    remotePatterns: [
      { hostname: "images.unsplash.com" },
      { hostname: "praia.info" },
      { hostname: "images.pexels.com" },
      { hostname: "upload.wikimedia.org" },
    ],
  },
};

export default nextConfig;
