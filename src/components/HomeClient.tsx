"use client";

import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FiBook,
  FiUsers,
  FiMessageSquare,
  FiHeart,
  FiAward,
  FiArrowRight,
  FiTrendingUp,
} from "react-icons/fi";
import { formatDistanceToNow } from "@/lib/utils";

interface HomeData {
  stats: { bookCount: number; userCount: number; postCount: number };
  recentPosts: Array<{
    id: string;
    content: string;
    type: string;
    createdAt: Date | string;
    user: { id: string; name: string; avatar: string | null };
    book: { id: string; title: string; titleZh: string | null; cover: string | null; author: string } | null;
    _count: { likes: number; comments: number };
  }>;
  featuredBooks: Array<{
    id: string;
    title: string;
    titleZh: string | null;
    author: string;
    authorZh: string | null;
    cover: string | null;
    genre: string | null;
    _count: { userBooks: number; posts: number };
  }>;
  leaderboard: Array<{
    id: string;
    name: string;
    avatar: string | null;
    booksFinished: number;
    postCount: number;
  }>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export function HomeClient({ data }: { data: HomeData }) {
  const { locale, t } = useLanguage();

  const postTypeColors: Record<string, string> = {
    review: "bg-purple-100 text-purple-700",
    progress: "bg-green-100 text-green-700",
    quote: "bg-yellow-100 text-yellow-700",
    share: "bg-blue-100 text-blue-700",
  };

  const postTypeLabels: Record<string, Record<string, string>> = {
    review: { zh: "书评", en: "Review" },
    progress: { zh: "进度", en: "Progress" },
    quote: { zh: "摘录", en: "Quote" },
    share: { zh: "分享", en: "Share" },
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl" />
        <div className="absolute top-40 left-1/3 w-48 h-48 bg-secondary-200/30 rounded-full blur-2xl" />

        {/* Floating book decorations */}
        <div className="absolute top-24 right-20 hidden lg:flex flex-col gap-4 opacity-60">
          {["📚", "📖", "✨", "🌟"].map((emoji, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
              className="text-3xl"
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-8"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
                <span>🔥</span>
                <span>{locale === "zh" ? "最活跃的读书社区" : "Most Active Reading Community"}</span>
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight"
            >
              <span className="gradient-text">{t.home.hero_title}</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
            >
              {t.home.hero_subtitle}
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/books"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <FiBook />
                {t.home.hero_cta}
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/share"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 border-2 border-primary-200 rounded-2xl font-semibold text-lg hover:bg-primary-50 transition-all hover:scale-105"
              >
                ✍️ {t.home.hero_cta2}
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeUp}
              className="flex justify-center gap-8 sm:gap-16 pt-4"
            >
              {[
                { icon: FiBook, count: data.stats.bookCount, label: t.home.stats_books, color: "text-primary-500" },
                { icon: FiUsers, count: data.stats.userCount, label: t.home.stats_users, color: "text-accent-500" },
                { icon: FiMessageSquare, count: data.stats.postCount, label: t.home.stats_posts, color: "text-secondary-600" },
              ].map(({ icon: Icon, count, label, color }) => (
                <div key={label} className="text-center">
                  <div className={`text-3xl sm:text-4xl font-extrabold ${color}`}>
                    {count.toLocaleString()}+
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40C360 80 1080 0 1440 40V80H0V40Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title={t.home.featured}
            icon="📚"
            link="/books"
            linkText={locale === "zh" ? "查看全部" : "View All"}
          />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {data.featuredBooks.map((book) => (
              <motion.div key={book.id} variants={fadeUp}>
                <Link href={`/books/${book.id}`} className="group block">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-md book-shadow group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2">
                    <Image
                      src={book.cover || "/placeholder-book.svg"}
                      alt={book.titleZh || book.title}
                      fill
                      className="object-cover"
                      onError={() => {}}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                      <p className="text-white text-xs font-medium line-clamp-2">
                        {locale === "zh" ? (book.titleZh || book.title) : book.title}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 px-1">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                      {locale === "zh" ? (book.titleZh || book.title) : book.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {locale === "zh" ? (book.authorZh || book.author) : book.author}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <FiUsers className="text-gray-400 text-xs" />
                      <span className="text-xs text-gray-400">{book._count.userBooks}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Recent Shares + Leaderboard */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Posts */}
            <div className="lg:col-span-2">
              <SectionHeader
                title={t.home.recent_shares}
                icon="✍️"
                link="/share"
                linkText={locale === "zh" ? "去分享" : "Share"}
              />
              <div className="space-y-4">
                {data.recentPosts.length === 0 ? (
                  <EmptyState
                    message={locale === "zh" ? "还没有分享，来第一个分享吧！" : "No shares yet. Be the first!"}
                    link="/share"
                    linkText={locale === "zh" ? "去分享" : "Share Now"}
                  />
                ) : (
                  data.recentPosts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {post.user.name[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-800 text-sm">
                              {post.user.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                postTypeColors[post.type] ?? "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {postTypeLabels[post.type]?.[locale] ?? post.type}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(post.createdAt), locale)}
                            </span>
                          </div>

                          {post.book && (
                            <Link
                              href={`/books/${post.book.id}`}
                              className="inline-flex items-center gap-1 mt-1 text-xs text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full"
                            >
                              <FiBook className="text-xs" />
                              {locale === "zh" ? (post.book.titleZh || post.book.title) : post.book.title}
                            </Link>
                          )}

                          <p className="mt-2 text-gray-700 text-sm leading-relaxed line-clamp-3">
                            {post.content}
                          </p>

                          <div className="flex items-center gap-4 mt-3 text-gray-400 text-xs">
                            <span className="flex items-center gap-1 hover:text-red-400 cursor-pointer transition-colors">
                              <FiHeart />
                              {post._count.likes}
                            </span>
                            <span className="flex items-center gap-1 hover:text-primary-500 cursor-pointer transition-colors">
                              <FiMessageSquare />
                              {post._count.comments}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Leaderboard */}
            <div>
              <SectionHeader title={t.home.leaderboard} icon="🏆" />
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {data.leaderboard.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    {locale === "zh" ? "暂无数据" : "No data yet"}
                  </div>
                ) : (
                  data.leaderboard.map((user, i) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className={`flex items-center gap-3 px-5 py-4 ${
                        i < data.leaderboard.length - 1 ? "border-b border-gray-50" : ""
                      } hover:bg-orange-50 transition-colors`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          i === 0
                            ? "bg-yellow-100 text-yellow-600"
                            : i === 1
                            ? "bg-gray-100 text-gray-600"
                            : i === 2
                            ? "bg-orange-100 text-orange-600"
                            : "bg-gray-50 text-gray-500"
                        }`}
                      >
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {user.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {user.booksFinished}{" "}
                          {locale === "zh" ? "本" : "books"}
                          {" · "}
                          {user.postCount}{" "}
                          {locale === "zh" ? "条" : "posts"}
                        </p>
                      </div>
                      <FiTrendingUp className="text-primary-400 flex-shrink-0" />
                    </motion.div>
                  ))
                )}
              </div>

              {/* CTA Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-4 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl p-6 text-white"
              >
                <div className="text-3xl mb-3">📖</div>
                <h3 className="font-bold text-lg mb-2">
                  {locale === "zh" ? "今天读了多少页？" : "How many pages today?"}
                </h3>
                <p className="text-white/80 text-sm mb-4">
                  {locale === "zh"
                    ? "每天进步一点点，一年后你会感谢自己"
                    : "A little progress every day adds up to big results"}
                </p>
                <Link
                  href="/share"
                  className="inline-flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-md transition-all"
                >
                  {locale === "zh" ? "记录今日阅读" : "Log Today's Reading"}
                  <FiArrowRight />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
              <FiBook className="text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">BookShare</span>
          </div>
          <p className="text-gray-400 text-sm">
            {locale === "zh"
              ? "共读好书，共同成长 · 让阅读成为一种习惯"
              : "Read together, grow together · Make reading a habit"}
          </p>
          <div className="flex justify-center gap-6 mt-4 text-xs text-gray-400">
            <Link href="/books" className="hover:text-primary-500 transition-colors">
              {t.nav.books}
            </Link>
            <Link href="/share" className="hover:text-primary-500 transition-colors">
              {t.nav.share}
            </Link>
            <Link href="/register" className="hover:text-primary-500 transition-colors">
              {t.nav.register}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({
  title,
  icon,
  link,
  linkText,
}: {
  title: string;
  icon: string;
  link?: string;
  linkText?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h2>
      {link && linkText && (
        <Link
          href={link}
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {linkText}
          <FiArrowRight />
        </Link>
      )}
    </div>
  );
}

function EmptyState({
  message,
  link,
  linkText,
}: {
  message: string;
  link: string;
  linkText: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-10 text-center">
      <div className="text-5xl mb-4">📭</div>
      <p className="text-gray-500 mb-4">{message}</p>
      <Link
        href={link}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-full text-sm font-medium hover:bg-primary-600 transition-colors"
      >
        {linkText}
        <FiArrowRight />
      </Link>
    </div>
  );
}
