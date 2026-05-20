import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["covers.openlibrary.org", "books.google.com", "via.placeholder.com", "api.dicebear.com"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  webpack: (config, { isServer }) => {
    // Required for react-pdf — canvas is optional and unused in browser rendering
    config.resolve.alias.canvas = false;

    // Copy pdfjs-dist worker (ES module) to /public so it can be served statically.
    // pdfjs-dist v5 only ships .mjs workers; we copy once per build to avoid CDN issues.
    if (!isServer) {
      try {
        const workerSrc = path.join(__dirname, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
        const workerDest = path.join(__dirname, "public/pdf.worker.min.mjs");
        if (fs.existsSync(workerSrc) && !fs.existsSync(workerDest)) {
          fs.copyFileSync(workerSrc, workerDest);
        }
      } catch {
        // Non-fatal — worker will fall back to CDN URL
      }
    }

    return config;
  },
};

export default nextConfig;
