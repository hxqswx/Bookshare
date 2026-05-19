"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { FiArrowLeft, FiBook, FiUsers, FiStar, FiHeart, FiMessageSquare, FiShare2 } from "react-icons/fi";
import { formatDistanceToNow } from "@/lib/utils";
import { BookCover } from "@/components/BookCover";

interface Book {
  id: string;
  title: string;
  titleZh: string | null;
  author: string;
  authorZh: string | null;
  cover: string | null;
  description: string | null;
  descriptionZh: string | null;
  genre: string | null;
  publishYear: number | null;
  posts: Array<{
    id: string;
    content: string;
    type: string;
    createdAt: Date | string;
    user: { id: string; name: string; image: string | null };
    _count: { likes: number; comments: number };
  }>;
  userBooks: Array<{
    status: string;
    rating: number | null;
    user: { id: string; name: string };
  }>;
  _count: { userBooks: number; posts: number };
}

export function BookDetailClient({ book }: { book: Book }) {
  const { locale, t } = useLanguage();

  const displayTitle = locale === "zh" ? (book.titleZh || book.title) : book.title;
  const displayAuthor = locale === "zh" ? (book.authorZh || book.author) : book.author;
  const displayDesc = locale === "zh" ? (book.descriptionZh || book.description) : book.description;

  const ratings = book.userBooks.filter((ub) => ub.rating).map((ub) => ub.rating!);
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;

  const statusCounts = {
    want_to_read: book.userBooks.filter((u) => u.status === "want_to_read").length,
    reading: book.userBooks.filter((u) => u.status === "reading").length,
    finished: book.userBooks.filter((u) => u.status === "finished").length,
  };

  const postTypeColors: Record<string, string> = {
    review: "bg-purple-100 text-purple-700",
    progress: "bg-green-100 text-green-700",
    quote: "bg-yellow-100 text-yellow-700",
    share: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/books"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors mb-6 text-sm font-medium"
        >
          <FiArrowLeft />
          {t.common.back}
        </Link>

        {/* Book Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm overflow-hidden mb-8"
        >
          <div className="bg-gradient-to-r from-primary-500 to-primary-700 h-32" />
          <div className="px-6 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row gap-6 -mt-16">
              {/* Cover */}
              <div className="relative w-28 sm:w-36 flex-shrink-0">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl border-4 border-white book-shadow">
                  <BookCover src={book.cover} alt={displayTitle} title={displayTitle} />
                </div>
              </div>

              {/* Info */}
              <div className="sm:pt-20 flex-1">
                {book.genre && (
                  <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium mb-2">
                    {book.genre}
                  </span>
                )}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-1">
                  {displayTitle}
                </h1>
                <p className="text-lg text-gray-500 mb-4">{displayAuthor}</p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  {avgRating && (
                    <span className="flex items-center gap-1 text-yellow-500 font-semibold">
                      <FiStar className="fill-yellow-500" />
                      {avgRating}
                      <span className="text-gray-400 font-normal">({ratings.length})</span>
                    </span>
                  )}
                  {book.publishYear && <span>📅 {book.publishYear}</span>}
                  <span className="flex items-center gap-1">
                    <FiUsers className="text-primary-400" />
                    {book._count.userBooks} {locale === "zh" ? "人在读" : "readers"}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiMessageSquare className="text-accent-400" />
                    {book._count.posts} {locale === "zh" ? "条分享" : "shares"}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {displayDesc && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl text-gray-600 text-sm leading-relaxed">
                {displayDesc}
              </div>
            )}

            {/* Reading Status Bar */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[
                { key: "want_to_read", label: t.books.want_to_read, color: "bg-blue-500", emoji: "📌" },
                { key: "reading", label: t.books.reading, color: "bg-green-500", emoji: "📖" },
                { key: "finished", label: t.books.finished, color: "bg-purple-500", emoji: "✅" },
              ].map(({ key, label, color, emoji }) => (
                <div key={key} className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl mb-1">{emoji}</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {statusCounts[key as keyof typeof statusCounts]}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <Link
                href={`/share?book=${book.id}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-semibold hover:shadow-md transition-all"
              >
                <FiShare2 />
                {t.books.share_book}
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Posts */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-5">
            <FiMessageSquare className="text-primary-500" />
            {t.home.recent_shares}
          </h2>

          {book.posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-gray-500 mb-4">
                {locale === "zh" ? "还没有分享，来第一个分享吧！" : "No shares yet. Be the first!"}
              </p>
              <Link
                href={`/share?book=${book.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-full text-sm font-medium"
              >
                <FiShare2 />
                {t.books.share_book}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {book.posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {post.user.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 text-sm">{post.user.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${postTypeColors[post.type] ?? "bg-gray-100 text-gray-600"}`}>
                          {post.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(post.createdAt), locale)}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-700 text-sm leading-relaxed">{post.content}</p>
                      <div className="flex items-center gap-4 mt-3 text-gray-400 text-xs">
                        <span className="flex items-center gap-1 hover:text-red-400 cursor-pointer transition-colors">
                          <FiHeart /> {post._count.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiMessageSquare /> {post._count.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
