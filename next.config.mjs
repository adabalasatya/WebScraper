import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["google-play-scraper"],
  // Pin tracing root to this project so Next doesn't pick up the stray
  // C:\Users\DELL\package-lock.json as the workspace root.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
