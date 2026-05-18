import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "BookShare - 共读好书，共同成长",
  description:
    "A book sharing and reading motivation community. Share your reading, track your progress, motivate each other. / 读书分享与互相促进社区，分享阅读感悟，追踪进度，共同进步。",
  keywords: ["books", "reading", "share", "community", "书籍", "阅读", "分享"],
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
