import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bookshare.vercel.app";
const SITE_NAME = "我们真的爱读书";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 共读好书，共同成长`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "一个双语读书分享社区，分享阅读感悟，追踪进度，共同进步。A bilingual book sharing community — share your reading, track progress, grow together.",
  keywords: ["books", "reading", "share", "community", "书籍", "阅读", "分享", "book club", "读书"],
  // ── PWA / installability ────────────────────────────────────────────
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
    startupImage: "/icons/icon.svg",
  },
  // ── Open Graph ──────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — 共读好书，共同成长`,
    description: "一个双语读书分享社区，分享阅读感悟，追踪进度，共同进步。",
    url: SITE_URL,
    locale: "zh_CN",
    alternateLocale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — 共读好书，共同成长`,
    description: "一个双语读书分享社区，分享阅读感悟，追踪进度，共同进步。",
  },
  // ── Icons ───────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/api/icons/192", sizes: "192x192", type: "image/png" },
      { url: "/api/icons/512", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/api/icons/192",
    // iOS Safari requires a real PNG for the home-screen icon
    apple: [{ url: "/api/icons/180", sizes: "180x180", type: "image/png" }],
    other: [
      { rel: "mask-icon", url: "/icons/icon.svg", color: "#2d6a4f" },
    ],
  },
};

// Theme colour and viewport live in `viewport` export (Next 14+)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2d6a4f" },
    { media: "(prefers-color-scheme: dark)",  color: "#1b4332" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,           // prevent auto-zoom on input focus (mobile UX)
  userScalable: false,
  viewportFit: "cover",      // full-screen on iPhone notch/Dynamic Island
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <head>
        {/* iOS standalone mode — hide browser chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
        {/* Windows tile */}
        <meta name="msapplication-TileColor" content="#2d6a4f" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-16">{children}</main>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                borderRadius: "12px",
                background: "#fff",
                color: "#333",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
