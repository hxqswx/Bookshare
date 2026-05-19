"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { BookCover } from "@/components/BookCover";
import { Avatar } from "@/components/Navbar";
import { formatDistanceToNow } from "@/lib/utils";
import {
  FiArrowRight, FiBook, FiUsers, FiMessageSquare,
  FiHeart, FiTrendingUp, FiStar,
} from "react-icons/fi";

type FeaturedBook = {
  id: string; title: string; titleZh: string | null;
  author: string; authorZh: string | null;
  cover: string | null; genre: string | null;
  description?: string | null; descriptionZh?: string | null;
  _count: { userBooks: number; posts: number };
};

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
  leaderboard: Array<{
    id: string; name: string; image: string | null;
    booksFinished: number; postCount: number;
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
              <Link href="/register" className="btn-brand text-base px-8 py-4 rounded-2xl shadow-brand">
                {locale === "zh" ? "免费加入" : "Join Free"}
                <FiArrowRight className="ml-1" />
              </Link>
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
          <SectionLabel>{locale === "zh" ? "为什么选择 BookShare" : "Why BookShare"}</SectionLabel>
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

      {/* ══════════════ ACTIVITY + LEADERBOARD ══════════════ */}
      <section className="py-24 bg-white">
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
                        <Avatar name={post.user.name} size={38} />
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
                      <span className="text-lg w-7 text-center">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-sm text-gray-400 font-semibold">{i + 1}</span>}
                      </span>
                      <Avatar name={u.name} size={34} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400">
                          {u.booksFinished} {locale === "zh" ? "本" : "books"} · {u.postCount} {locale === "zh" ? "条" : "posts"}
                        </p>
                      </div>
                      <FiTrendingUp className="text-brand-400 flex-shrink-0 text-sm" />
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Join CTA card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-2xl bg-forest-gradient text-white p-7"
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/10" />
              <div className="relative">
                <div className="text-4xl mb-4">📖</div>
                <h3 className="heading text-xl font-bold mb-2">
                  {locale === "zh" ? "今天读了多少页？" : "How many pages today?"}
                </h3>
                <p className="text-white/70 text-sm mb-5">
                  {locale === "zh" ? "每天进步1%，365天后提升37倍" : "1% better daily = 37× in a year"}
                </p>
                <Link href="/share" className="inline-flex items-center gap-2 bg-white text-forest-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:shadow-lg transition-all">
                  {locale === "zh" ? "记录今日阅读" : "Log Today"} <FiArrowRight />
                </Link>
              </div>
            </motion.div>
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
                ? "加入数千位书友，用阅读改变自己"
                : "Join thousands of readers and change yourself through reading"}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-brand text-lg px-10 py-4 rounded-2xl shadow-brand">
                {locale === "zh" ? "立即免费注册" : "Sign Up Free"}
              </Link>
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
                <span className="font-serif font-bold text-xl">BookShare</span>
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
                  ["/register", locale === "zh" ? "加入" : "Join"],
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
                  ? "BookShare 是一个由书迷创建的阅读社区，致力于让每一本好书被更多人发现。"
                  : "BookShare is a reading community built by book lovers, dedicated to helping great books reach more readers."}
              </p>
            </div>
          </div>
          <div className="border-t border-forest-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-forest-500">© 2025 BookShare. {locale === "zh" ? "保留所有权利。" : "All rights reserved."}</p>
          </div>
        </div>
      </footer>
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
