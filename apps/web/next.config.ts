import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "trip-loom-bucket.s3.sa-east-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
