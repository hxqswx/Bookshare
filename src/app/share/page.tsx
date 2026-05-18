"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import {
  FiBook,
  FiMessageSquare,
  FiHeart,
  FiSend,
  FiLock,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "@/lib/utils";

interface Post {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
  book: { id: string; title: string; titleZh: string | null; cover: string | null; author: string } | null;
  _count: { likes: number; comments: number };
}

interface Book {
  id: string;
  title: string;
  titleZh: string | null;
  author: string;
}

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBooks = async () => {
    try {
      // fetch up to 100 books for the dropdown
      const res = await fetch("/api/books?page=1&limit=100");
      const data = await res.json();
      setBooks(data.books || []);
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
      toast.success(locale === "zh" ? "分享成功！🎉" : "Posted successfully! 🎉");
    } catch {
      toast.error(locale === "zh" ? "发布失败，请重试" : "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!session) {
      toast.error(locale === "zh" ? "请先登录" : "Please log in");
      return;
    }
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      const data = await res.json();
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (data.liked) next.add(postId);
        else next.delete(postId);
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

  const postTypes = [
    { key: "share", label: t.share.type_share, emoji: "💬" },
    { key: "review", label: t.share.type_review, emoji: "⭐" },
    { key: "progress", label: t.share.type_progress, emoji: "📊" },
    { key: "quote", label: t.share.type_quote, emoji: "💡" },
  ];

  const postTypeColors: Record<string, string> = {
    review: "bg-purple-100 text-purple-700",
    progress: "bg-green-100 text-green-700",
    quote: "bg-yellow-100 text-yellow-700",
    share: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-gradient-to-r from-accent-500 to-primary-500 text-white py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-extrabold mb-2">✍️ {t.share.title}</h1>
          <p className="text-white/80">
            {locale === "zh"
              ? "分享你的阅读收获，激励更多人爱上阅读"
              : "Share your reading insights and inspire more people to love reading"}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Share Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm overflow-hidden"
        >
          {!session ? (
            <div className="p-10 text-center">
              <FiLock className="mx-auto text-5xl text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                {t.share.login_required}
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                {locale === "zh"
                  ? "注册并登录，开始你的读书分享之旅"
                  : "Register and log in to start sharing your reading journey"}
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/login"
                  className="px-6 py-2.5 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition-colors"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2.5 border border-primary-300 text-primary-600 rounded-full font-medium hover:bg-primary-50 transition-colors"
                >
                  {t.nav.register}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6">
              {/* User avatar + type selector */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {session.user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {postTypes.map(({ key, label, emoji }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setType(key)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        type === key
                          ? "bg-primary-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Book selector */}
              <div className="mb-3">
                <select
                  value={bookId}
                  onChange={(e) => setBookId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                >
                  <option value="">📚 {t.share.select_book}</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {locale === "zh" ? (b.titleZh || b.title) : b.title} — {b.author}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t.share.content_placeholder}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none placeholder-gray-400"
              />

              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs ${content.length > 500 ? "text-red-400" : "text-gray-400"}`}>
                  {content.length} / 500
                </span>
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FiSend />
                  {loading ? (locale === "zh" ? "发布中..." : "Posting...") : t.share.submit}
                </button>
              </div>
            </form>
          )}
        </motion.div>

        {/* Posts Feed */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-5">
            <FiMessageSquare className="text-primary-500" />
            {locale === "zh" ? "大家的分享" : "Community Shares"}
          </h2>

          <div className="space-y-4">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {post.user.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">{post.user.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${postTypeColors[post.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {postTypes.find((p) => p.key === post.type)?.emoji}{" "}
                        {postTypes.find((p) => p.key === post.type)?.label ?? post.type}
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

                    <p className="mt-2 text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>

                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-all hover:scale-110 ${
                          likedPosts.has(post.id)
                            ? "text-red-500"
                            : "text-gray-400 hover:text-red-400"
                        }`}
                      >
                        <FiHeart className={likedPosts.has(post.id) ? "fill-red-500" : ""} />
                        {post._count.likes}
                      </button>
                      <span className="flex items-center gap-1.5 text-xs text-gray-400">
                        <FiMessageSquare />
                        {post._count.comments}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {posts.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-400">
                  {locale === "zh" ? "还没有分享，来第一个吧！" : "No shares yet. Be the first!"}
                </p>
              </div>
            )}

            {hasMore && posts.length > 0 && (
              <button
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  fetchPosts(next);
                }}
                className="w-full py-3 bg-white rounded-2xl text-sm text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors shadow-sm"
              >
                {locale === "zh" ? "加载更多..." : "Load more..."}
              </button>
            )}
          </div>
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
