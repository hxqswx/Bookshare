"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { Avatar } from "@/components/Navbar";
import { FiArrowRight } from "react-icons/fi";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { locale } = useLanguage();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-gradient">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">📚</div>
          <div className="flex gap-1 justify-center">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="min-h-screen bg-warm-gradient pb-16">
      {/* Hero */}
      <div className="bg-forest-gradient pt-24 pb-20 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <Avatar name={session.user?.name} size={80} />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-1">{session.user?.name}</h1>
          <p className="text-forest-300 text-sm">{session.user?.email}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8">
        {/* Stats cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { emoji: "📌", label: locale === "zh" ? "想读" : "Want to Read", value: "—" },
            { emoji: "📖", label: locale === "zh" ? "在读" : "Reading",       value: "—" },
            { emoji: "✅", label: locale === "zh" ? "已读" : "Finished",      value: "—" },
          ].map(({ emoji, label, value }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 text-center"
            >
              <div className="text-3xl mb-2">{emoji}</div>
              <div className="text-3xl font-bold text-forest-800 mb-1">{value}</div>
              <div className="text-sm text-gray-400">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Onboarding card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-10 text-center"
        >
          <div className="text-6xl mb-5">🚀</div>
          <h2 className="font-serif text-2xl font-bold text-forest-900 mb-3">
            {locale === "zh" ? "开始你的阅读之旅！" : "Start Your Reading Journey!"}
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
            {locale === "zh"
              ? "浏览书库找到感兴趣的书，标记在读状态，然后和书友分享你的感悟。"
              : "Browse the library, find books you love, track your progress, and share insights with fellow readers."}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/books" className="btn-brand">
              {locale === "zh" ? "浏览书库" : "Browse Books"} <FiArrowRight />
            </Link>
            <Link href="/share" className="btn-outline">
              {locale === "zh" ? "去分享" : "Share"}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
