import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server actions
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Transpile workspace packages for proper bundling with Turbopack
  transpilePackages: ['@repo/database', '@repo/agent-core', '@repo/sandbox-providers', '@repo/storage'],
  
  // Externalize Prisma to fix Turbopack bundling issues
  // See: https://github.com/prisma/prisma/issues/21505
  serverExternalPackages: ['@prisma/client', 'prisma'],
  
  // Output standalone build for Docker deployments
  output: 'standalone',
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
