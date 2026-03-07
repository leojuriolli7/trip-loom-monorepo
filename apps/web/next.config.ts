import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    maximumResponseBody: 500_000_000, // 500MB
    remotePatterns: [
      {
        protocol: "https",
        hostname: "trip-loom-bucket.s3.sa-east-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
