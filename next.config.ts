import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" }, // Todo: Find a better way to limit this Image Optimization
      { hostname: "avatars.githubusercontent.com" },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
