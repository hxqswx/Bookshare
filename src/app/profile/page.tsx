"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { Avatar } from "@/components/Navbar";
import { FiArrowRight, FiMessageSquare } from "react-icons/fi";

interface Stats {
  wantToRead: number;
  reading: number;
  finished: number;
  postCount: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { locale } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile/stats")
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, [status]);

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

  const statCards = [
    { emoji: "📌", label: locale === "zh" ? "想读" : "Want to Read", value: stats?.wantToRead },
    { emoji: "📖", label: locale === "zh" ? "在读" : "Reading",       value: stats?.reading },
    { emoji: "✅", label: locale === "zh" ? "已读" : "Finished",      value: stats?.finished },
    { emoji: "💬", label: locale === "zh" ? "分享" : "Posts",         value: stats?.postCount },
  ];

  const hasActivity = stats && (stats.wantToRead + stats.reading + stats.finished + stats.postCount) > 0;

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
          {session.user?.isAdmin && (
            <Link href="/admin"
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-full transition-colors">
              🛡️ {locale === "zh" ? "进入管理后台" : "Admin Panel"}
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map(({ emoji, label, value }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="card p-5 text-center"
            >
              <div className="text-2xl mb-2">{emoji}</div>
              <div className="text-3xl font-bold text-forest-800 mb-1">
                {value === undefined ? (
                  <span className="inline-block w-8 h-7 bg-gray-100 rounded-lg animate-pulse" />
                ) : value}
              </div>
              <div className="text-xs text-gray-400">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Reading progress card (only shown if has books) */}
        {stats && (stats.wantToRead + stats.reading + stats.finished) > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="card p-6">
            <h3 className="font-serif text-lg font-bold text-forest-900 mb-4">
              {locale === "zh" ? "阅读进度" : "Reading Progress"}
            </h3>
            <div className="space-y-3">
              {[
                { label: locale === "zh" ? "想读" : "Want to Read", value: stats.wantToRead, color: "bg-sky-400", emoji: "📌" },
                { label: locale === "zh" ? "在读" : "Reading",       value: stats.reading,    color: "bg-brand-400", emoji: "📖" },
                { label: locale === "zh" ? "已读" : "Finished",      value: stats.finished,   color: "bg-forest-500", emoji: "✅" },
              ].map(({ label, value, color, emoji }) => {
                const total = stats.wantToRead + stats.reading + stats.finished;
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 flex items-center gap-1.5">{emoji} {label}</span>
                      <span className="font-semibold text-forest-800">{value} <span className="text-gray-400 font-normal text-xs">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: 0.4 }}
                        className={`h-full rounded-full ${color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Onboarding card (only shown if no activity yet) */}
        {!hasActivity && stats !== null && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="card p-10 text-center">
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
                <FiMessageSquare />
                {locale === "zh" ? "去分享" : "Share"}
              </Link>
            </div>
          </motion.div>
        )}

        {/* Quick links (shown when has activity) */}
        {hasActivity && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="grid sm:grid-cols-2 gap-4">
            <Link href="/books" className="card p-5 flex items-center gap-4 hover:border-brand-200 group">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-brand-100 transition-colors">📚</div>
              <div>
                <p className="font-semibold text-forest-900 text-sm group-hover:text-brand-600 transition-colors">
                  {locale === "zh" ? "继续浏览书库" : "Browse Library"}
                </p>
                <p className="text-xs text-gray-400">{locale === "zh" ? "发现更多好书" : "Find more books"}</p>
              </div>
              <FiArrowRight className="ml-auto text-gray-300 group-hover:text-brand-400 transition-colors" />
            </Link>
            <Link href="/share" className="card p-5 flex items-center gap-4 hover:border-brand-200 group">
              <div className="w-10 h-10 bg-forest-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-forest-100 transition-colors">✍️</div>
              <div>
                <p className="font-semibold text-forest-900 text-sm group-hover:text-brand-600 transition-colors">
                  {locale === "zh" ? "分享读书感悟" : "Share Insights"}
                </p>
                <p className="text-xs text-gray-400">{locale === "zh" ? "记录你的阅读" : "Record your reading"}</p>
              </div>
              <FiArrowRight className="ml-auto text-gray-300 group-hover:text-brand-400 transition-colors" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
