import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Regione UE per le funzioni serverless (requisito GDPR, SPEC §8).
  // Su Vercel si imposta anche da dashboard: Functions > Region > fra1.
  experimental: {},
};

export default nextConfig;
