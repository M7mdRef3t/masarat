import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@alrehla/masarat"],
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
