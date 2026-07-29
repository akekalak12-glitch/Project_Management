import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer, nextRuntime }) => {
    // Apply optimizations only for the Edge runtime build to keep size under 3MB on Cloudflare
    if (isServer && nextRuntime === 'edge') {
      config.output = {
        ...config.output,
        globalObject: 'globalThis',
      };

      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            prisma: {
              name: 'prisma-shared',
              test: /[\\/]node_modules[\\/](@prisma|prisma)[\\/]/,
              chunks: 'all',
              priority: 50,
              enforce: true,
            },
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
              priority: 20,
            }
          }
        }
      };
    }
    return config;
  }
};

export default nextConfig;
