import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Required so the generated Prisma client is bundled correctly for the
  // Cloudflare Workers (workerd) runtime under @opennextjs/cloudflare.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
