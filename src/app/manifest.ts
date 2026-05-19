import type { MetadataRoute } from "next";

/**
 * Next.js App Router built-in manifest route.
 * Served at /manifest.webmanifest with the correct Content-Type.
 * Next.js automatically injects <link rel="manifest"> into every page <head>.
 * This is the most reliable approach — no manual <link> tag needed.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "我们真的爱读书",
    short_name: "爱读书",
    description:
      "双语读书分享社区 — 分享阅读感悟，追踪进度，共同进步。A bilingual book sharing community.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#FFFDF9",
    theme_color: "#2d6a4f",
    categories: ["books", "education", "social"],
    icons: [
      {
        src: "/api/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "书单",
        short_name: "书单",
        description: "浏览所有书籍",
        url: "/books",
        icons: [{ src: "/api/icons/192", sizes: "192x192" }],
      },
      {
        name: "分享",
        short_name: "分享",
        description: "分享读书感悟",
        url: "/share",
        icons: [{ src: "/api/icons/192", sizes: "192x192" }],
      },
    ],
  };
}
