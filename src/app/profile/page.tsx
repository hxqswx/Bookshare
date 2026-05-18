"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { FiBook } from "react-icons/fi";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { locale } = useLanguage();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">📚</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 py-16 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white text-4xl font-extrabold mx-auto mb-4 border-4 border-white/30">
            {session.user?.name?.[0]?.toUpperCase()}
          </div>
          <h1 className="text-3xl font-extrabold mb-1">{session.user?.name}</h1>
          <p className="text-white/70 text-sm">{session.user?.email}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          {[
            { emoji: "📚", label: locale === "zh" ? "想读" : "Want to Read", value: "-" },
            { emoji: "📖", label: locale === "zh" ? "在读" : "Reading", value: "-" },
            { emoji: "✅", label: locale === "zh" ? "已读" : "Finished", value: "-" },
          ].map(({ emoji, label, value }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm text-center"
            >
              <div className="text-3xl mb-2">{emoji}</div>
              <div className="text-3xl font-extrabold text-gray-800 mb-1">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {locale === "zh" ? "开始你的阅读之旅！" : "Start Your Reading Journey!"}
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            {locale === "zh"
              ? "浏览书库，找到你感兴趣的书，开始阅读并分享你的收获"
              : "Browse the library, find books you love, and share your insights"}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/books"
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:shadow-md transition-all"
            >
              {locale === "zh" ? "浏览书库" : "Browse Books"}
            </Link>
            <Link
              href="/share"
              className="px-6 py-3 border-2 border-primary-200 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
            >
              {locale === "zh" ? "去分享" : "Share"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
