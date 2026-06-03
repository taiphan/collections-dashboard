import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emit a standalone server bundle for container deploys (small image, no
  // node_modules copy needed beyond the traced set).
  output: 'standalone',
  // Pin the Turbopack root so the platform doesn't latch onto the workspace root lockfile.
  turbopack: {
    root: __dirname,
  },
  // typedRoutes will be enabled once /studio and /worklist routes exist (Tasks 9, 19).
  // The proxy.ts at project root handles tenant + auth resolution per Next.js 16 conventions.
};

export default nextConfig;
