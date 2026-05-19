"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBook,
  FiMessageSquare,
  FiHeart,
  FiSend,
  FiLock,
  FiEdit3,
  FiFilter,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "@/lib/utils";

interface Post {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
  book: { id: string; title: string; titleZh: string | null; cover: string | null; author: string } | null;
  _count: { likes: number; comments: number };
}

interface Book {
  id: string;
  title: string;
  titleZh: string | null;
  author: string;
  genre: string | null;
}

interface GenreItem {
  id: string;
  name: string;
  nameZh: string | null;
}

/* Deterministic image colour from name */
const AVATAR_COLORS = [
  "from-brand-400 to-brand-600",
  "from-forest-400 to-forest-600",
  "from-purple-400 to-purple-600",
  "from-sky-400 to-sky-600",
  "from-rose-400 to-rose-600",
  "from-amber-400 to-amber-600",
];
function imageGradient(name: string) {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

const TYPE_CONFIG: Record<string, { emoji: string; labelZh: string; labelEn: string; pill: string }> = {
  share:    { emoji: "💬", labelZh: "分享",   labelEn: "Share",    pill: "bg-sky-50 text-sky-700 border-sky-100" },
  review:   { emoji: "⭐", labelZh: "书评",   labelEn: "Review",   pill: "bg-purple-50 text-purple-700 border-purple-100" },
  progress: { emoji: "📊", labelZh: "进度",   labelEn: "Progress", pill: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  quote:    { emoji: "💡", labelZh: "摘录",   labelEn: "Quote",    pill: "bg-amber-50 text-amber-700 border-amber-100" },
};

function SharePageContent() {
  const { data: session } = useSession();
  const { locale, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBook = searchParams.get("book");

  const [content, setContent] = useState("");
  const [type, setType] = useState("share");
  const [bookId, setBookId] = useState(preselectedBook || "");
  const [books, setBooks] = useState<Book[]>([]);
  const [genreFilter, setGenreFilter] = useState("");
  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchBooks = async () => {
    try {
      const [booksRes, genresRes] = await Promise.all([
        fetch("/api/books?page=1&limit=100"),
        fetch("/api/genres"),
      ]);
      const booksData = await booksRes.json();
      const genresData = await genresRes.json();
      setBooks(booksData.books || []);
      setGenres(Array.isArray(genresData) ? genresData : []);
    } catch {}
  };

  const fetchPosts = async (p: number, reset = false) => {
    try {
      const res = await fetch(`/api/posts?page=${p}`);
      const data = await res.json();
      if (reset) {
        setPosts(data.posts || []);
      } else {
        setPosts((prev) => [...prev, ...(data.posts || [])]);
      }
      setHasMore(p < data.pages);
    } catch {}
  };

  useEffect(() => {
    fetchBooks();
    fetchPosts(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error(locale === "zh" ? "请先登录" : "Please log in first");
      router.push("/login");
      return;
    }
    if (!content.trim()) {
      toast.error(locale === "zh" ? "请输入分享内容" : "Please enter content");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type, bookId: bookId || null }),
      });
      if (!res.ok) throw new Error();
      const newPost = await res.json();
      setPosts((prev) => [newPost, ...prev]);
      setContent("");
      setBookId(preselectedBook || "");
      toast.success(locale === "zh" ? "分享成功！🎉" : "Posted! 🎉");
    } catch {
      toast.error(locale === "zh" ? "发布失败，请重试" : "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!session) {
      toast.error(locale === "zh" ? "请先登录后再操作" : "Please log in first");
      router.push("/login");
      return;
    }
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      const data = await res.json();
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (data.liked) next.add(postId); else next.delete(postId);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, _count: { ...p._count, likes: p._count.likes + (data.liked ? 1 : -1) } }
            : p
        )
      );
    } catch {}
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    await fetchPosts(next);
    setLoadingMore(false);
  };

  const postTypesArr = Object.entries(TYPE_CONFIG).map(([key, v]) => ({
    key, emoji: v.emoji,
    label: locale === "zh" ? v.labelZh : v.labelEn,
  }));

  const charCount = content.length;
  const maxChars = 500;

  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-20">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute text-4xl opacity-[0.08] select-none"
              style={{ left: `${(i * 16 + 8) % 88}%`, top: `${(i * 23 + 10) % 75}%`, transform: `rotate(${i * 20}deg)` }}>
              ✍️
            </div>
          ))}
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
          <p className="text-brand-100 text-sm font-medium uppercase tracking-widest mb-2">
            {locale === "zh" ? "读书分享" : "Reading Shares"}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight">
            {t.share.title}
          </h1>
          <p className="text-brand-100 mt-3 text-base leading-relaxed">
            {locale === "zh"
              ? "分享你的阅读收获，激励更多人爱上阅读"
              : "Share your reading insights and inspire others to read more"}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-6 relative z-10 space-y-5">

        {/* Composer / Lock Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl border border-cream-200 shadow-card overflow-hidden"
        >
          {!session ? (
            /* Locked state */
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FiLock className="text-3xl text-gray-300" />
              </div>
              <h3 className="font-serif text-xl font-bold text-forest-900 mb-2">
                {t.share.login_required}
              </h3>
              <p className="text-gray-400 text-sm mb-7 max-w-xs mx-auto leading-relaxed">
                {locale === "zh"
                  ? "注册并登录，开始你的读书分享之旅"
                  : "Create an account to start sharing your reading journey"}
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/register" className="btn-brand px-6 py-2.5 rounded-xl text-sm">
                  {t.nav.register}
                </Link>
                <Link href="/login" className="btn-outline px-6 py-2.5 rounded-xl text-sm">
                  {t.nav.login}
                </Link>
              </div>
            </div>
          ) : (
            /* Composer */
            <div className="p-5">
              {/* User + type selector */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${imageGradient(session.user?.name || "U")} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-forest-900 mb-2">{session.user?.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {postTypesArr.map(({ key, emoji, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setType(key)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                          type === key
                            ? "bg-brand-500 text-white border-brand-500 shadow-sm"
                            : "bg-white text-gray-500 border-cream-200 hover:border-brand-200 hover:text-brand-600"
                        }`}
                      >
                        {emoji} {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Genre filter + Book selector */}
                <div className="space-y-2">
                  {/* Genre filter chips */}
                  {genres.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <FiFilter className="text-[9px]" />
                        {locale === "zh" ? "分类" : "Genre"}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setGenreFilter(""); setBookId(""); }}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${
                          genreFilter === ""
                            ? "bg-brand-500 text-white border-brand-500"
                            : "bg-white text-gray-500 border-cream-200 hover:border-brand-200 hover:text-brand-600"
                        }`}
                      >
                        {locale === "zh" ? "全部" : "All"}
                      </button>
                      {genres.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => { setGenreFilter(g.name); setBookId(""); }}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${
                            genreFilter === g.name
                              ? "bg-brand-500 text-white border-brand-500"
                              : "bg-white text-gray-500 border-cream-200 hover:border-brand-200 hover:text-brand-600"
                          }`}
                        >
                          {locale === "zh" ? (g.nameZh || g.name) : g.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Book selector */}
                  <div className="relative">
                    <FiBook className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm" />
                    <select
                      value={bookId}
                      onChange={(e) => setBookId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-cream-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white appearance-none cursor-pointer"
                    >
                      <option value="">📚 {t.share.select_book}</option>
                      {books
                        .filter((b) => !genreFilter || b.genre === genreFilter)
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {locale === "zh" ? (b.titleZh || b.title) : b.title} — {b.author}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t.share.content_placeholder}
                    rows={4}
                    className="w-full px-4 py-3 border border-cream-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none placeholder-gray-300 transition-shadow"
                  />
                  <div className={`absolute bottom-3 right-3 text-[10px] font-medium transition-colors ${charCount > maxChars ? "text-red-400" : "text-gray-300"}`}>
                    {charCount}/{maxChars}
                  </div>
                </div>

                {/* Submit row */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !content.trim() || charCount > maxChars}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition-all hover:shadow-brand disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                  >
                    {loading
                      ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <FiSend className="text-xs" />}
                    {loading
                      ? (locale === "zh" ? "发布中…" : "Posting…")
                      : t.share.submit}
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>

        {/* Feed Header */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="font-serif text-xl font-bold text-forest-900 flex items-center gap-2">
            <FiEdit3 className="text-brand-500" />
            {locale === "zh" ? "大家的分享" : "Community Shares"}
          </h2>
          <span className="text-sm text-gray-400">{posts.length} {locale === "zh" ? "条" : "posts"}</span>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {posts.map((post, i) => {
              const tc = TYPE_CONFIG[post.type] ?? TYPE_CONFIG.share;
              const typeLabel = locale === "zh" ? tc.labelZh : tc.labelEn;
              const liked = likedPosts.has(post.id);
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.25), duration: 0.3 }}
                  className="bg-white rounded-2xl border border-cream-200 p-5 hover:border-brand-100 hover:shadow-card transition-all"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${imageGradient(post.user.name)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {post.user.name[0]?.toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                        <span className="font-semibold text-forest-900 text-sm">{post.user.name}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tc.pill}`}>
                          {tc.emoji} {typeLabel}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(post.createdAt), locale)}
                        </span>
                      </div>

                      {/* Book tag */}
                      {post.book && (
                        <Link
                          href={`/books/${post.book.id}`}
                          className="inline-flex items-center gap-1 mt-1.5 text-xs text-forest-700 hover:text-forest-900 bg-forest-50 hover:bg-forest-100 border border-forest-100 px-2.5 py-0.5 rounded-full transition-colors"
                        >
                          <FiBook className="text-[9px]" />
                          {locale === "zh" ? (post.book.titleZh || post.book.title) : post.book.title}
                        </Link>
                      )}

                      {/* Content */}
                      <p className="mt-2.5 text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-5 mt-3.5">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1.5 text-xs font-medium transition-all hover:scale-110 active:scale-95 ${
                            liked ? "text-red-500" : "text-gray-400 hover:text-red-400"
                          }`}
                        >
                          <FiHeart className={liked ? "fill-red-500" : ""} />
                          <span>{post._count.likes}</span>
                        </button>
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <FiMessageSquare />
                          <span>{post._count.comments}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty */}
          {posts.length === 0 && (
            <div className="bg-white rounded-2xl border border-cream-200 p-14 text-center">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-500 font-medium mb-1">
                {locale === "zh" ? "还没有分享" : "No shares yet"}
              </p>
              <p className="text-gray-400 text-sm">
                {locale === "zh" ? "成为第一个分享读书心得的人！" : "Be the first to share your reading insights!"}
              </p>
            </div>
          )}

          {/* Load More */}
          {hasMore && posts.length > 0 && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-3.5 bg-white border border-cream-200 rounded-2xl text-sm text-gray-500 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50/30 transition-all disabled:opacity-60 font-medium"
            >
              {loadingMore
                ? (locale === "zh" ? "加载中…" : "Loading…")
                : (locale === "zh" ? "加载更多" : "Load more")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense>
      <SharePageContent />
    </Suspense>
  );
}
