/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["covers.openlibrary.org", "books.google.com", "via.placeholder.com", "api.dicebear.com"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  webpack: (config) => {
    // Required for react-pdf — canvas is optional and unused in browser rendering
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
