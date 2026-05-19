"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { BookCover } from "@/components/BookCover";
import { Avatar } from "@/components/Navbar";
import { formatDistanceToNow } from "@/lib/utils";
import {
  FiArrowRight, FiBook, FiUsers, FiMessageSquare,
  FiHeart, FiStar, FiCopy, FiCheck, FiZap,
} from "react-icons/fi";
import { SiX, SiFacebook, SiWhatsapp, SiWechat, SiTiktok } from "react-icons/si";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";

type FeaturedBook = {
  id: string; title: string; titleZh: string | null;
  author: string; authorZh: string | null;
  cover: string | null; genre: string | null;
  description?: string | null; descriptionZh?: string | null;
  _count: { userBooks: number; posts: number };
};

type ReaderPickBook = FeaturedBook & { statusCount: number };

interface HomeData {
  stats: { bookCount: number; userCount: number; postCount: number; newUsersThisMonth: number };
  recentPosts: Array<{
    id: string; content: string; type: string; createdAt: Date | string;
    user: { id: string; name: string; image: string | null };
    book: { id: string; title: string; titleZh: string | null; cover: string | null; author: string } | null;
    _count: { likes: number; comments: number };
  }>;
  pinnedBooks: FeaturedBook[];
  featuredBooks: FeaturedBook[];
  readerPicks: {
    topWantToRead: ReaderPickBook | null;
    topReading:    ReaderPickBook | null;
    topFinished:   ReaderPickBook | null;
  };
  leaderboard: Array<{
    id: string; name: string; image: string | null;
    booksFinished: number; pagesThisMonth: number; postCount: number; score: number;
  }>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

const TYPE_BADGE: Record<string, { label: string; labelEn: string; color: string }> = {
  review:   { label: "书评", labelEn: "Review",   color: "bg-purple-100 text-purple-700" },
  progress: { label: "进度", labelEn: "Progress", color: "bg-emerald-100 text-emerald-700" },
  quote:    { label: "摘录", labelEn: "Quote",    color: "bg-amber-100 text-amber-700" },
  share:    { label: "分享", labelEn: "Share",    color: "bg-sky-100 text-sky-700" },
};

export function HomeClient({ data }: { data: HomeData }) {
  const { locale, t } = useLanguage();
  const { data: session } = useSession();

  return (
    <div className="overflow-hidden">

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative min-h-[92vh] flex items-center bg-warm-gradient overflow-hidden pt-16">

        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-brand-100/50 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full bg-forest-100/40 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-cream-200/30 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left copy ── */}
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-600 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                {locale === "zh" ? `${data.stats.userCount}+ 书友正在阅读` : `${data.stats.userCount}+ readers active`}
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] text-forest-900 mb-6">
              {locale === "zh" ? (
                <>让阅读<br /><span className="gradient-brand">连接彼此</span></>
              ) : (
                <>Read Together,<br /><span className="gradient-brand">Grow Together</span></>
              )}
            </motion.h1>

            <motion.p variants={fadeUp} className="text-xl text-gray-500 leading-relaxed mb-10 max-w-lg">
              {t.home.hero_subtitle}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 mb-14">
              {session ? (
                <a href="#daily-checkin" className="btn-brand text-base px-8 py-4 rounded-2xl shadow-brand">
                  📖 {locale === "zh" ? "记录今日阅读" : "Log Today's Reading"}
                  <FiArrowRight className="ml-1" />
                </a>
              ) : (
                <Link href="/register" className="btn-brand text-base px-8 py-4 rounded-2xl shadow-brand">
                  {locale === "zh" ? "免费加入" : "Join Free"}
                  <FiArrowRight className="ml-1" />
                </Link>
              )}
              <Link href="/books" className="btn-outline text-base px-8 py-4 rounded-2xl">
                {t.home.hero_cta}
              </Link>
            </motion.div>

            {/* Trust strip */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-6 items-center">
              {[
                { icon: "📚", value: `${data.stats.bookCount}+`, label: locale === "zh" ? "本书" : "Books" },
                { icon: "👥", value: `${data.stats.userCount}+`, label: locale === "zh" ? "书友" : "Readers" },
                { icon: "✍️", value: `${data.stats.postCount}+`, label: locale === "zh" ? "条分享" : "Shares" },
              ].map(({ icon, value, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <div className="text-xl font-bold text-forest-800">{value}</div>
                    <div className="text-xs text-gray-400">{label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right visual ── */}
          <div className="relative hidden lg:block h-[520px]">
            <HeroIllustration books={[...data.pinnedBooks, ...data.featuredBooks].slice(0, 3)} locale={locale} newUsersThisMonth={data.stats.newUsersThisMonth} />
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 28C480 56 960 0 1440 28V56H0V28Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ══════════════ FEATURES ══════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel>{locale === "zh" ? "为什么选择我们" : "Why Join Us"}</SectionLabel>
          <h2 className="heading text-4xl font-bold text-center text-forest-900 mb-16">
            {locale === "zh" ? "阅读，不再孤独" : "Reading, Never Alone"}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                emoji: "🗺️",
                title: locale === "zh" ? "追踪阅读旅程" : "Track Your Journey",
                desc: locale === "zh"
                  ? "记录每一本读过的书，标记进度，为已完成的书打分，建立属于你的书单。"
                  : "Log every book you've read, track your progress, rate finished books, and build your personal reading list.",
              },
              {
                emoji: "💬",
                title: locale === "zh" ? "分享真实感悟" : "Share Real Insights",
                desc: locale === "zh"
                  ? "用书评、摘录、进度动态与书友互动，你的每一句话都可能点燃他人的阅读热情。"
                  : "Share reviews, quotes, and progress updates. Your words might ignite someone else's reading passion.",
              },
              {
                emoji: "🏆",
                title: locale === "zh" ? "互相激励进步" : "Motivate Each Other",
                desc: locale === "zh"
                  ? "排行榜让阅读变成一场友好的竞赛，看谁在这个月读得最多、分享最多。"
                  : "Leaderboards turn reading into a friendly competition. See who reads and shares the most this month.",
              },
            ].map(({ emoji, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="card p-8 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-3xl mx-auto mb-5">
                  {emoji}
                </div>
                <h3 className="heading text-xl font-semibold text-forest-900 mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ EDITOR'S PICKS ══════════════ */}
      {data.pinnedBooks.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-forest-800 via-forest-700 to-forest-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-8">
              <span className="text-amber-400 text-xl">⭐</span>
              <span className="text-sm font-semibold text-amber-300 tracking-widest uppercase">
                {locale === "zh" ? "编辑推荐" : "Editor's Picks"}
              </span>
            </div>

            <div className="space-y-5">
              {data.pinnedBooks.map((book, i) => {
                const title  = locale === "zh" ? (book.titleZh  || book.title)  : book.title;
                const author = locale === "zh" ? (book.authorZh || book.author) : book.author;
                const desc   = locale === "zh" ? (book.descriptionZh || book.description) : book.description;
                return (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link href={`/books/${book.id}`}
                      className="group flex flex-col sm:flex-row gap-6 bg-white/10 hover:bg-white/15 border border-white/20 rounded-3xl p-6 transition-all hover:shadow-2xl hover:border-amber-400/40">
                      {/* Cover */}
                      <div className="flex-shrink-0 w-24 sm:w-28">
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden book-shadow group-hover:-translate-y-1 transition-transform duration-300">
                          <BookCover src={book.cover} alt={title} title={title} />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {book.genre && (
                            <span className="text-[11px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-medium">
                              {book.genre}
                            </span>
                          )}
                          <span className="text-[11px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <FiUsers className="text-[9px]" />
                            {book._count.userBooks} {locale === "zh" ? "人在读" : "readers"}
                          </span>
                        </div>

                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-1 leading-snug group-hover:text-amber-200 transition-colors">
                          {title}
                        </h3>
                        <p className="text-forest-300 text-sm mb-3">{author}</p>

                        {desc && (
                          <p className="text-white/60 text-sm leading-relaxed line-clamp-2 mb-4">
                            {desc}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm group-hover:gap-3 transition-all">
                          {locale === "zh" ? "查看详情" : "View Book"}
                          <FiArrowRight />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ READER'S PICKS ══════════════ */}
      {(data.readerPicks.topWantToRead || data.readerPicks.topReading || data.readerPicks.topFinished) && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionLabel>{locale === "zh" ? "读者推荐" : "Reader's Picks"}</SectionLabel>
            <h2 className="heading text-4xl font-bold text-forest-900 mb-3">
              {locale === "zh" ? "书友们最爱的书" : "Most Loved by Readers"}
            </h2>
            <p className="text-gray-400 text-sm mb-10">
              {locale === "zh" ? "根据真实阅读数据，由书友投票产生" : "Based on real reading data from our community"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { book: data.readerPicks.topWantToRead, status: "want_to_read",
                  emoji: "📌", labelZh: "最多想读", labelEn: "Most Wishlisted",
                  bg: "from-sky-50 to-sky-100/60", border: "border-sky-200",
                  badge: "bg-sky-100 text-sky-700 border-sky-200",
                  countColor: "text-sky-600" },
                { book: data.readerPicks.topReading, status: "reading",
                  emoji: "📖", labelZh: "最多在读", labelEn: "Most Reading Now",
                  bg: "from-brand-50 to-brand-100/60", border: "border-brand-200",
                  badge: "bg-brand-100 text-brand-700 border-brand-200",
                  countColor: "text-brand-600" },
                { book: data.readerPicks.topFinished, status: "finished",
                  emoji: "✅", labelZh: "最多读完", labelEn: "Most Completed",
                  bg: "from-forest-50 to-forest-100/60", border: "border-forest-200",
                  badge: "bg-forest-100 text-forest-700 border-forest-200",
                  countColor: "text-forest-600" },
              ].map(({ book, emoji, labelZh, labelEn, bg, border, badge, countColor }, i) => {
                if (!book) return null;
                const title  = locale === "zh" ? (book.titleZh  || book.title)  : book.title;
                const author = locale === "zh" ? (book.authorZh || book.author) : book.author;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}>
                    <Link href={`/books/${book.id}`}
                      className={`group flex flex-col h-full bg-gradient-to-br ${bg} border ${border} rounded-3xl p-5 hover:shadow-card-hover transition-all hover:-translate-y-1`}>
                      {/* Category label */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge}`}>
                          {emoji} {locale === "zh" ? labelZh : labelEn}
                        </span>
                      </div>

                      {/* Book card */}
                      <div className="flex gap-4 flex-1">
                        {/* Cover */}
                        <div className="flex-shrink-0 w-20">
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden book-shadow group-hover:-translate-y-1 transition-transform duration-300">
                            <BookCover src={book.cover} alt={title} title={title} />
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h3 className="font-serif font-bold text-forest-900 text-base leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors mb-1">
                              {title}
                            </h3>
                            <p className="text-xs text-gray-500 line-clamp-1">{author}</p>
                            {book.genre && (
                              <span className="inline-block mt-2 px-2 py-0.5 bg-white/60 text-gray-600 text-[10px] rounded-full font-medium">
                                {book.genre}
                              </span>
                            )}
                          </div>
                          <div className={`mt-3 font-bold text-lg ${countColor}`}>
                            {book.statusCount}
                            <span className="text-xs font-normal text-gray-400 ml-1">
                              {locale === "zh" ? "人" : " readers"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-gray-400 group-hover:text-brand-500 transition-colors">
                        {locale === "zh" ? "查看详情" : "View Book"}
                        <FiArrowRight className="text-[11px] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ FEATURED BOOKS ══════════════ */}
      <section className="py-24 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <SectionLabel>{locale === "zh" ? "热门书库" : "Popular Books"}</SectionLabel>
              <h2 className="heading text-4xl font-bold text-forest-900">
                {locale === "zh" ? "大家都在读" : "What People Are Reading"}
              </h2>
            </div>
            <Link href="/books" className="btn-ghost hidden sm:flex">
              {locale === "zh" ? "查看全部" : "View All"} <FiArrowRight />
            </Link>
          </div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5"
          >
            {data.featuredBooks.map((book) => (
              <motion.div key={book.id} variants={fadeUp}>
                <Link href={`/books/${book.id}`} className="group block">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden book-shadow group-hover:-translate-y-2 group-hover:shadow-card-hover transition-all duration-300">
                    <BookCover src={book.cover} alt={book.titleZh || book.title} title={book.titleZh || book.title} />
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-brand-500 transition-colors">
                      {locale === "zh" ? (book.titleZh || book.title) : book.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {locale === "zh" ? (book.authorZh || book.author) : book.author}
                    </p>
                    {book._count.userBooks > 0 && (
                      <p className="text-xs text-brand-400 mt-1 flex items-center gap-1">
                        <FiUsers className="text-[10px]" />{book._count.userBooks}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════ ACTIVITY + LEADERBOARD + DAILY CHECK-IN ══════════════ */}
      <section id="daily-checkin" className="py-24 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-10">

          {/* Activity feed — 3 cols */}
          <div className="lg:col-span-3">
            <SectionLabel>{locale === "zh" ? "最新动态" : "Recent Activity"}</SectionLabel>
            <h2 className="heading text-3xl font-bold text-forest-900 mb-8">
              {locale === "zh" ? "书友们在说什么" : "What Readers Are Saying"}
            </h2>

            {data.recentPosts.length === 0 ? (
              <EmptyFeed locale={locale} />
            ) : (
              <div className="space-y-4">
                {data.recentPosts.slice(0, 5).map((post, i) => {
                  const badge = TYPE_BADGE[post.type] ?? TYPE_BADGE.share;
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 }}
                      className="card p-5"
                    >
                      <div className="flex gap-3">
                        <Avatar name={post.user.name} image={post.user.image} size={38} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-sm text-gray-800">{post.user.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.color}`}>
                              {locale === "zh" ? badge.label : badge.labelEn}
                            </span>
                            <span className="text-xs text-gray-400 ml-auto">
                              {formatDistanceToNow(new Date(post.createdAt), locale)}
                            </span>
                          </div>
                          {post.book && (
                            <Link href={`/books/${post.book.id}`}
                              className="inline-flex items-center gap-1 text-[11px] text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full mb-2 hover:bg-brand-100 transition-colors">
                              <FiBook className="text-[10px]" />
                              {locale === "zh" ? (post.book.titleZh || post.book.title) : post.book.title}
                            </Link>
                          )}
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{post.content}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1 hover:text-rose-400 cursor-pointer transition-colors">
                              <FiHeart /> {post._count.likes}
                            </span>
                            <span className="flex items-center gap-1 hover:text-brand-500 cursor-pointer transition-colors">
                              <FiMessageSquare /> {post._count.comments}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div className="text-center pt-4">
                  <Link href="/share" className="btn-outline text-sm">
                    {locale === "zh" ? "查看更多动态" : "See More Activity"} <FiArrowRight />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — 2 cols */}
          <div className="lg:col-span-2 space-y-8">
            {/* Leaderboard */}
            <div>
              <SectionLabel>{locale === "zh" ? "阅读排行" : "Leaderboard"}</SectionLabel>
              <h2 className="heading text-2xl font-bold text-forest-900 mb-5">🏆 {t.home.leaderboard}</h2>
              <div className="card overflow-hidden divide-y divide-cream-100">
                {data.leaderboard.length === 0 ? (
                  <p className="p-8 text-center text-sm text-gray-400">{locale === "zh" ? "暂无数据" : "No data yet"}</p>
                ) : (
                  data.leaderboard.map((u, i) => (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-cream-50 transition-colors"
                    >
                      <span className="text-lg w-7 text-center flex-shrink-0">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-sm text-gray-400 font-semibold">{i + 1}</span>}
                      </span>
                      <Avatar name={u.name} image={u.image} size={34} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400">
                          📚 {u.booksFinished}{locale === "zh" ? "本" : " books"}
                          {u.pagesThisMonth > 0 && (
                            <> · 📄 {u.pagesThisMonth}{locale === "zh" ? "页" : " pages"}</>
                          )}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-brand-600">{u.score}</p>
                        <p className="text-[10px] text-gray-400">{locale === "zh" ? "积分" : "pts"}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Daily Check-in Widget */}
            <DailyCheckinWidget locale={locale} session={session} />
          </div>
        </div>
      </section>

      {/* ══════════════ FINAL CTA ══════════════ */}
      <section className="py-24 bg-warm-gradient border-t border-cream-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-5xl mb-6">🌟</div>
            <h2 className="heading text-4xl sm:text-5xl font-bold text-forest-900 mb-5">
              {locale === "zh" ? "开始你的阅读之旅" : "Start Your Reading Journey"}
            </h2>
            <p className="text-gray-500 text-xl mb-10">
              {locale === "zh"
                ? (session ? "继续你的阅读之旅，和书友们分享吧" : "加入数千位书友，用阅读改变自己")
                : (session ? "Continue your journey — share what you're reading" : "Join thousands of readers and change yourself through reading")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {session ? (
                <>
                  <a href="#daily-checkin" className="btn-brand text-lg px-10 py-4 rounded-2xl shadow-brand">
                    📖 {locale === "zh" ? "记录今日阅读" : "Log Today's Reading"}
                  </a>
                  <Link href="/share" className="btn-outline text-lg px-10 py-4 rounded-2xl">
                    ✍️ {locale === "zh" ? "去分享" : "Share a Book"}
                  </Link>
                </>
              ) : (
                <Link href="/register" className="btn-brand text-lg px-10 py-4 rounded-2xl shadow-brand">
                  {locale === "zh" ? "立即免费注册" : "Sign Up Free"}
                </Link>
              )}
              <Link href="/books" className="btn-outline text-lg px-10 py-4 rounded-2xl">
                {locale === "zh" ? "先逛逛书库" : "Browse Books First"}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="bg-forest-900 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📚</span>
                <span className="font-serif font-bold text-xl">我们真的爱读书</span>
              </div>
              <p className="text-forest-300 text-sm leading-relaxed">
                {locale === "zh" ? "共读好书，共同成长。让阅读连接每一个思考的人。"
                  : "Read together, grow together. Let reading connect every thinking person."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-forest-200 mb-4">{locale === "zh" ? "探索" : "Explore"}</h4>
              <div className="space-y-2 text-sm text-forest-400">
                {[
                  ["/books", locale === "zh" ? "书库" : "Books"],
                  ["/share", locale === "zh" ? "分享" : "Share"],
                  ...(!session ? [["/register", locale === "zh" ? "加入" : "Join"]] as [string, string][] : []),
                ].map(([href, label]) => (
                  <div key={href}>
                    <Link href={href} className="hover:text-brand-400 transition-colors">{label}</Link>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-forest-200 mb-4">{locale === "zh" ? "关于" : "About"}</h4>
              <p className="text-sm text-forest-400 leading-relaxed">
                {locale === "zh"
                  ? "「我们真的爱读书」是一个由书迷创建的阅读社区，致力于让每一本好书被更多人发现。"
                  : "A reading community built by book lovers, dedicated to helping great books reach more readers."}
              </p>
            </div>
          </div>

          {/* ── Social Share Row ── */}
          <FooterShareRow locale={locale} />

          <div className="border-t border-forest-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-forest-500">© 2026 我们真的爱读书. {locale === "zh" ? "保留所有权利。" : "All rights reserved."}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Daily Check-in Widget ── */

type SessionData = ReturnType<typeof useSession>["data"];

interface LogEntry { date: string; pages: number; note: string }

function heatColor(pages: number): string {
  if (!pages) return "bg-gray-100";
  if (pages <= 10) return "bg-brand-200";
  if (pages <= 25) return "bg-brand-400";
  if (pages <= 50) return "bg-brand-500";
  return "bg-forest-500";
}

function streakMotivation(streak: number, locale: string): string {
  if (streak === 0) return locale === "zh" ? "今天开始你的阅读打卡吧！" : "Start your reading streak today!";
  if (streak <= 3)  return locale === "zh" ? `好的开始！已连续 ${streak} 天 🌱` : `Great start! ${streak}-day streak 🌱`;
  if (streak <= 7)  return locale === "zh" ? `太棒了！已连续 ${streak} 天 ✨` : `Amazing! ${streak}-day streak ✨`;
  if (streak <= 14) return locale === "zh" ? `势不可挡！已连续 ${streak} 天 🔥` : `On fire! ${streak}-day streak 🔥`;
  if (streak <= 30) return locale === "zh" ? `阅读达人！已连续 ${streak} 天 🔥🔥` : `Reading master! ${streak} days 🔥🔥`;
  return locale === "zh" ? `超级书虫！已连续 ${streak} 天 🔥🔥🔥` : `Bookworm legend! ${streak} days 🔥🔥🔥`;
}

function DailyCheckinWidget({ locale, session }: { locale: string; session: SessionData }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [logs, setLogs]         = useState<Map<string, number>>(new Map());
  const [inputPages, setInputPages] = useState("");
  const [inputNote, setInputNote]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState("");
  const [loaded, setLoaded]     = useState(false);

  // Fetch current month's logs
  useEffect(() => {
    if (!session) return;
    const now = new Date();
    fetch(`/api/reading-log?year=${now.getUTCFullYear()}&month=${now.getUTCMonth() + 1}`)
      .then(r => r.json())
      .then((data: LogEntry[]) => {
        const map = new Map<string, number>();
        for (const l of data) {
          map.set(l.date, l.pages);
          if (l.date === todayStr) {
            setInputPages(String(l.pages));
            setInputNote(l.note ?? "");
          }
        }
        setLogs(map);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [session, todayStr]);

  // Streak: consecutive days ending today
  const streak = useMemo(() => {
    let s = 0;
    const d = new Date();
    for (let i = 0; i < 31; i++) {
      const key = d.toISOString().slice(0, 10);
      if ((logs.get(key) ?? 0) > 0) { s++; d.setUTCDate(d.getUTCDate() - 1); }
      else break;
    }
    return s;
  }, [logs]);

  // Last 7 days for mini heatmap
  const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 6 + i);
    const key = d.toISOString().slice(0, 10);
    const dayNames = locale === "zh"
      ? ["日","一","二","三","四","五","六"]
      : ["Su","Mo","Tu","We","Th","Fr","Sa"];
    return { key, label: dayNames[d.getUTCDay()], pages: logs.get(key) ?? 0, isToday: key === todayStr };
  }), [logs, todayStr, locale]);

  const monthPages  = useMemo(() => Array.from(logs.values()).reduce((a, b) => a + b, 0), [logs]);
  const daysLogged  = useMemo(() => Array.from(logs.values()).filter(p => p > 0).length, [logs]);
  const todayLogged = (logs.get(todayStr) ?? 0) > 0;
  const todayPages  = logs.get(todayStr) ?? 0;

  const handleCheckin = async () => {
    const pages = parseInt(inputPages, 10);
    if (!Number.isInteger(pages) || pages < 1 || pages > 9999) {
      setSaveMsg(locale === "zh" ? "请输入 1-9999 的数字" : "Enter 1–9999");
      return;
    }
    setSaving(true); setSaveMsg("");
    try {
      const res = await fetch("/api/reading-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages, note: inputNote.trim() || null, date: todayStr }),
      });
      if (!res.ok) throw new Error();
      const log = await res.json() as { date: string; pages: number };
      setLogs(prev => new Map(prev).set(log.date, log.pages));
      setSaveMsg(locale === "zh" ? "🎉 打卡成功！" : "🎉 Logged!");
      setTimeout(() => setSaveMsg(""), 4000);
    } catch {
      setSaveMsg(locale === "zh" ? "保存失败，请重试" : "Failed, please retry");
    } finally {
      setSaving(false);
    }
  };

  // Streak-based accent colour
  const accentGrad =
    streak >= 15 ? "from-orange-500 to-red-500" :
    streak >= 7  ? "from-amber-400 to-orange-500" :
    streak >= 3  ? "from-brand-400 to-brand-600" :
                   "from-forest-500 to-forest-700";

  // ── Non-logged-in teaser ──
  if (!session) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-2xl bg-forest-gradient text-white p-7"
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative">
          <div className="text-4xl mb-3">📖</div>
          <h3 className="heading text-xl font-bold mb-2">
            {locale === "zh" ? "今天读了多少页？" : "How many pages today?"}
          </h3>
          <p className="text-white/70 text-sm mb-5 leading-relaxed">
            {locale === "zh"
              ? "每天进步 1%，365 天后提升 37 倍。记录每日阅读，坚持就是胜利。"
              : "1% better daily = 37× growth in a year. Track your reading streak."}
          </p>
          <div className="flex gap-2 flex-wrap">
            <Link href="/register"
              className="inline-flex items-center gap-1.5 bg-white text-forest-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:shadow-lg transition-all">
              {locale === "zh" ? "免费加入" : "Join Free"} <FiArrowRight size={13} />
            </Link>
            <Link href="/login"
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all">
              {locale === "zh" ? "登录" : "Log In"}
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Logged-in interactive widget ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-cream-200 overflow-hidden shadow-sm bg-white"
    >
      {/* Coloured header strip */}
      <div className={`bg-gradient-to-r ${accentGrad} px-5 py-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{streak >= 7 ? "🔥" : streak >= 3 ? "✨" : "📖"}</span>
            <div>
              <p className="font-bold text-sm leading-tight">
                {locale === "zh" ? "每日打卡" : "Daily Reading Log"}
              </p>
              <p className="text-white/80 text-[11px]">
                {new Date().toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", { month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          {/* Streak badge */}
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              className="text-center bg-white/20 rounded-xl px-3 py-1.5"
            >
              <p className="text-lg font-black leading-none">{streak}</p>
              <p className="text-[10px] text-white/80 leading-none mt-0.5">
                {locale === "zh" ? "天连续" : "day streak"}
              </p>
            </motion.div>
          )}
        </div>
        <p className="text-white/90 text-xs mt-2 font-medium">
          {streakMotivation(streak, locale)}
        </p>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Mini week heatmap */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {locale === "zh" ? "本周打卡" : "This week"}
          </p>
          <div className="flex gap-1.5">
            {last7.map(({ key, label, pages, isToday }) => (
              <div key={key} className="flex-1 flex flex-col items-center gap-1">
                <div
                  title={pages ? `${pages}${locale === "zh" ? "页" : " pages"}` : undefined}
                  className={`
                    w-full aspect-square rounded-md transition-all
                    ${heatColor(pages)}
                    ${isToday ? "ring-2 ring-offset-1 ring-brand-500" : ""}
                  `}
                />
                <span className={`text-[9px] font-semibold ${isToday ? "text-brand-600" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Today status banner */}
        <AnimatePresence mode="wait">
          {loaded && todayLogged && (
            <motion.div
              key="logged"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 bg-forest-50 border border-forest-100 rounded-xl px-3 py-2"
            >
              <span className="text-forest-500 text-base">✅</span>
              <p className="text-xs font-semibold text-forest-700">
                {locale === "zh"
                  ? `今日已读 ${todayPages} 页`
                  : `Today: ${todayPages} pages logged`}
              </p>
              <span className="ml-auto text-[10px] text-forest-400">
                {locale === "zh" ? "可更新" : "tap to update"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input form */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min={1}
                max={9999}
                value={inputPages}
                onChange={e => setInputPages(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCheckin()}
                placeholder={locale === "zh" ? "今天读了几页？" : "Pages read today"}
                className="w-full px-3 py-2.5 border border-cream-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white transition-shadow pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300">
                {locale === "zh" ? "页" : "pg"}
              </span>
            </div>
            <button
              onClick={handleCheckin}
              disabled={saving || !inputPages}
              className={`
                flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                bg-gradient-to-r ${accentGrad} text-white
                hover:opacity-90 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
              `}
            >
              {saving
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                : (locale === "zh" ? (todayLogged ? "更新" : "打卡") : (todayLogged ? "Update" : "Log"))}
            </button>
          </div>
          <input
            type="text"
            value={inputNote}
            onChange={e => setInputNote(e.target.value)}
            placeholder={locale === "zh" ? "备注（选填）：今天读了什么…" : "Note (optional): what did you read…"}
            maxLength={200}
            className="w-full px-3 py-2 border border-cream-200 rounded-xl text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white transition-shadow placeholder-gray-300"
          />
        </div>

        {/* Save message */}
        <AnimatePresence>
          {saveMsg && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-sm font-semibold ${saveMsg.startsWith("🎉") ? "text-forest-600" : "text-red-500"}`}
            >
              {saveMsg}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Monthly stats */}
        <div className="flex items-center justify-between pt-1 border-t border-cream-100">
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-base font-bold text-forest-800">{monthPages}</p>
              <p className="text-[10px] text-gray-400">{locale === "zh" ? "本月页数" : "pages/mo"}</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-forest-800">{daysLogged}</p>
              <p className="text-[10px] text-gray-400">{locale === "zh" ? "打卡天数" : "days"}</p>
            </div>
          </div>
          <Link href="/profile"
            className="text-[11px] text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-0.5 transition-colors">
            {locale === "zh" ? "查看完整记录" : "Full history"}
            <FiArrowRight size={10} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Footer Social Share Row ── */
const SITE_URL_HOME =
  typeof window !== "undefined" ? window.location.origin : "";

function FooterShareRow({ locale }: { locale: string }) {
  const [copied, setCopied] = useState(false);
  const [douyinCopied, setDouyinCopied] = useState(false);
  const [showWechatQr, setShowWechatQr] = useState(false);

  const pageUrl = SITE_URL_HOME || "https://bookshare.vercel.app";
  const shareText =
    locale === "zh"
      ? "推荐一个读书社区「我们真的爱读书」，快来一起读书吧！"
      : "Join us on 「我们真的爱读书」 — a bilingual reading community!";
  const douyinText =
    locale === "zh"
      ? `📚 ${shareText}\n\n#读书 #阅读 #我们真的爱读书\n\n${pageUrl}`
      : `📚 ${shareText}\n\n#reading #books\n\n${pageUrl}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&color=1a4731&bgcolor=ffffff&data=${encodeURIComponent(pageUrl)}`;

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(pageUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  const copyDouyin = async () => {
    try { await navigator.clipboard.writeText(douyinText); setDouyinCopied(true); setTimeout(() => setDouyinCopied(false), 2500); } catch {}
  };

  const platforms = [
    {
      key: "x", icon: <SiX />, label: "X",
      color: "hover:bg-black hover:border-black",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`,
    },
    {
      key: "facebook", icon: <SiFacebook />, label: "Facebook",
      color: "hover:bg-[#1877F2] hover:border-[#1877F2]",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
    },
    {
      key: "whatsapp", icon: <SiWhatsapp />, label: "WhatsApp",
      color: "hover:bg-[#25D366] hover:border-[#25D366]",
      href: `https://wa.me/?text=${encodeURIComponent(shareText + " " + pageUrl)}`,
    },
    {
      key: "weibo", icon: <span className="text-[11px] font-bold leading-none">微博</span>, label: locale === "zh" ? "微博" : "Weibo",
      color: "hover:bg-[#E6162D] hover:border-[#E6162D]",
      href: `https://service.weibo.com/share/share.php?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(shareText)}`,
    },
  ];

  return (
    <div className="border-t border-forest-800 pt-8 pb-6">
      <p className="text-xs font-semibold text-forest-400 uppercase tracking-widest mb-4 text-center">
        {locale === "zh" ? "分享给朋友 · 让更多人爱上阅读" : "Share with friends · Spread the love of reading"}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* Standard link-open platforms */}
        {platforms.map(({ key, icon, label, color, href }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 border border-forest-700 rounded-xl text-forest-300 text-sm transition-all hover:text-white ${color}`}
          >
            <span className="text-base leading-none">{icon}</span>
            <span className="text-xs font-medium">{label}</span>
          </a>
        ))}

        {/* WeChat QR */}
        <div className="relative">
          <button
            onClick={() => setShowWechatQr(v => !v)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-sm transition-all ${
              showWechatQr
                ? "bg-[#07C160] text-white border-[#07C160]"
                : "border-forest-700 text-forest-300 hover:bg-[#07C160] hover:text-white hover:border-[#07C160]"
            }`}
          >
            <SiWechat className="text-base" />
            <span className="text-xs font-medium">{locale === "zh" ? "微信" : "WeChat"}</span>
          </button>
          {showWechatQr && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-20 bg-white rounded-2xl shadow-2xl p-3 w-48 text-center">
              <p className="text-xs text-gray-500 mb-2">
                {locale === "zh" ? "微信扫一扫" : "Scan with WeChat"}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR" width={160} height={160} className="rounded-xl mx-auto" />
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45" />
            </div>
          )}
        </div>

        {/* Douyin */}
        <button
          onClick={copyDouyin}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-sm transition-all ${
            douyinCopied
              ? "bg-black text-white border-black"
              : "border-forest-700 text-forest-300 hover:bg-black hover:text-white hover:border-black"
          }`}
          title={locale === "zh" ? "复制文字，粘贴到抖音发布" : "Copy text to post on Douyin"}
        >
          <SiTiktok className="text-base" />
          <span className="text-xs font-medium">
            {douyinCopied ? (locale === "zh" ? "已复制！" : "Copied!") : (locale === "zh" ? "抖音" : "Douyin")}
          </span>
        </button>

        {/* Copy link */}
        <button
          onClick={copyLink}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-sm transition-all ${
            copied
              ? "bg-brand-500 text-white border-brand-500"
              : "border-forest-700 text-forest-300 hover:bg-brand-500 hover:text-white hover:border-brand-500"
          }`}
        >
          {copied ? <FiCheck className="text-base" /> : <FiCopy className="text-base" />}
          <span className="text-xs font-medium">
            {copied ? (locale === "zh" ? "已复制" : "Copied!") : (locale === "zh" ? "复制链接" : "Copy link")}
          </span>
        </button>
      </div>

      {douyinCopied && (
        <p className="text-xs text-forest-400 text-center mt-3">
          📋 {locale === "zh" ? "文字和话题已复制，打开抖音粘贴发布吧！" : "Text & hashtags copied — paste into Douyin!"}
        </p>
      )}
    </div>
  );
}

/* ── Hero Illustration ── */
function HeroIllustration({ books, locale, newUsersThisMonth }: { books: HomeData["featuredBooks"]; locale: string; newUsersThisMonth: number }) {
  const cards = [
    { rotate: "-6deg", x: "5%",  y: "5%",  delay: 0 },
    { rotate: "4deg",  x: "38%", y: "18%", delay: 0.15 },
    { rotate: "-2deg", x: "15%", y: "50%", delay: 0.3 },
  ];
  return (
    <div className="relative w-full h-full">
      {/* Glow bg */}
      <div className="absolute inset-10 rounded-full bg-gradient-to-br from-brand-100 to-forest-100 blur-2xl opacity-60" />

      {/* Floating book cards */}
      {cards.map(({ rotate, x, y, delay }, i) => {
        const book = books[i];
        if (!book) return null;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + delay, duration: 0.6 }}
            className="absolute bg-white rounded-2xl shadow-card-hover p-4 w-52 cursor-pointer hover:shadow-2xl transition-shadow"
            style={{
              left: x, top: y,
              rotate,
              animation: `float ${4 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }}
          >
            <div className="flex gap-3 items-start">
              <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 book-shadow">
                <BookCover src={book.cover} alt={book.title} title={book.title} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">
                  {locale === "zh" ? (book.titleZh || book.title) : book.title}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                  {locale === "zh" ? (book.authorZh || book.author) : book.author}
                </p>
                <div className="flex items-center gap-0.5 mt-1.5">
                  {[...Array(5)].map((_, j) => (
                    <FiStar key={j} className="text-amber-400 fill-amber-400 text-[10px]" />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Stats pill */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-[8%] right-[5%] bg-white rounded-2xl shadow-card-hover px-5 py-4 flex items-center gap-3"
        style={{ animation: "float 5s ease-in-out infinite", animationDelay: "1.5s" }}
      >
        <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center text-white text-xl">🔥</div>
        <div>
          <p className="text-xs text-gray-400">{locale === "zh" ? "本月新增" : "This month"}</p>
          <p className="text-lg font-bold text-forest-800">+{newUsersThisMonth} {locale === "zh" ? "位书友" : "readers"}</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Helpers ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-0.5 rounded-full bg-brand-400" />
      <span className="text-sm font-semibold text-brand-500 tracking-wide uppercase">{children}</span>
    </div>
  );
}

function EmptyFeed({ locale }: { locale: string }) {
  return (
    <div className="card p-12 text-center">
      <div className="text-5xl mb-4">📭</div>
      <p className="text-gray-400 mb-5 text-sm">
        {locale === "zh" ? "还没有分享，来第一个吧！" : "No shares yet. Be the first!"}
      </p>
      <Link href="/share" className="btn-brand text-sm">
        {locale === "zh" ? "立即分享" : "Share Now"} <FiArrowRight />
      </Link>
    </div>
  );
}
