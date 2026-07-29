import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime !== 'edge') {
      // Local dev / Node.js runtime: swap prisma.ts → prisma.node.ts (SQLite, no edge deps)
      // Use the resolved absolute path as the alias key so webpack matches it reliably
      config.resolve.alias[path.resolve(__dirname, 'src/lib/prisma')] =
        path.resolve(__dirname, 'src/lib/prisma.node.ts');
    }
    // Edge runtime (Cloudflare Workers): prisma.ts stays as-is (D1 adapter only)
    return config;
  },
};

export default nextConfig;
