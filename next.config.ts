import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // TypeScript errors are checked separately; don't block the production build
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint errors also should not block production builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
