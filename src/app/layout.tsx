import type { Metadata } from "next";
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
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — 共读好书，共同成长`,
    description:
      "一个双语读书分享社区，分享阅读感悟，追踪进度，共同进步。",
    url: SITE_URL,
    locale: "zh_CN",
    alternateLocale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — 共读好书，共同成长`,
    description: "一个双语读书分享社区，分享阅读感悟，追踪进度，共同进步。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
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
