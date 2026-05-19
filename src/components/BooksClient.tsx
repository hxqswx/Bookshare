"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiBook, FiUsers, FiMessageSquare, FiPlus, FiX, FiGrid, FiList } from "react-icons/fi";
import toast from "react-hot-toast";
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
  _count: { userBooks: number; posts: number };
}

interface BooksData {
  books: Book[];
  genres: string[];
}

export function BooksClient({
  initialData,
  initialQuery,
  initialGenre,
}: {
  initialData: BooksData;
  initialQuery: string;
  initialGenre: string;
}) {
  const { locale, t } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [genre, setGenre] = useState(initialGenre);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [newBook, setNewBook] = useState({
    title: "", titleZh: "", author: "", authorZh: "",
    cover: "", description: "", genre: "", publishYear: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (genre) params.set("genre", genre);
    router.push(`/books?${params.toString()}`);
  };

  const handleGenre = (g: string) => {
    const newGenre = g === genre ? "" : g;
    setGenre(newGenre);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (newGenre) params.set("genre", newGenre);
    router.push(`/books?${params.toString()}`);
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error(locale === "zh" ? "请先登录" : "Please log in first");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newBook,
          publishYear: newBook.publishYear ? parseInt(newBook.publishYear) : null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(locale === "zh" ? "书籍添加成功！" : "Book added successfully!");
      setShowAddModal(false);
      setNewBook({ title: "", titleZh: "", author: "", authorZh: "", cover: "", description: "", genre: "", publishYear: "" });
      router.refresh();
    } catch {
      toast.error(locale === "zh" ? "添加失败，请重试" : "Failed to add book");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-20">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-forest-700 via-forest-600 to-forest-500 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute text-4xl opacity-[0.07] select-none"
              style={{ left: `${(i * 13 + 5) % 92}%`, top: `${(i * 21 + 8) % 80}%`, transform: `rotate(${i * 17}deg)` }}>
              📚
            </div>
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <div>
              <p className="text-forest-200 text-sm font-medium uppercase tracking-widest mb-2">
                {locale === "zh" ? "书库" : "Library"}
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight">
                {t.books.title}
              </h1>
              <p className="text-forest-200 mt-3 text-base">
                {initialData.books.length > 0
                  ? locale === "zh"
                    ? `共收录 ${initialData.books.length} 本好书`
                    : `${initialData.books.length} books in the collection`
                  : locale === "zh" ? "探索精彩书单" : "Explore great books"}
              </p>
            </div>
            {session && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white text-forest-700 rounded-2xl font-semibold text-sm hover:bg-cream-50 hover:shadow-lg transition-all hover:-translate-y-0.5 self-start sm:self-auto flex-shrink-0"
              >
                <FiPlus className="text-brand-500" />
                {locale === "zh" ? "添加书籍" : "Add Book"}
              </button>
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 sm:gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.books.search}
                className="w-full pl-11 pr-4 py-3.5 bg-white/95 backdrop-blur rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60 shadow-lg text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold text-sm transition-colors shadow-brand flex-shrink-0"
            >
              {locale === "zh" ? "搜索" : "Search"}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters + View Toggle Row */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleGenre("")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                genre === ""
                  ? "bg-forest-600 text-white border-forest-600 shadow-sm"
                  : "bg-white text-gray-600 border-cream-200 hover:border-forest-300 hover:text-forest-700"
              }`}
            >
              {t.books.all_genres}
            </button>
            {initialData.genres.map((g) => (
              <button
                key={g}
                onClick={() => handleGenre(g)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  genre === g
                    ? "bg-forest-600 text-white border-forest-600 shadow-sm"
                    : "bg-white text-gray-600 border-cream-200 hover:border-forest-300 hover:text-forest-700"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-white border border-cream-200 rounded-xl p-1 flex-shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-forest-50 text-forest-700" : "text-gray-400 hover:text-gray-600"}`}
              aria-label="Grid view"
            >
              <FiGrid className="text-sm" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-forest-50 text-forest-700" : "text-gray-400 hover:text-gray-600"}`}
              aria-label="List view"
            >
              <FiList className="text-sm" />
            </button>
          </div>
        </div>

        {/* Results count when searching */}
        {(initialQuery || initialGenre) && (
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <span>{locale === "zh" ? "搜索结果：" : "Results: "}</span>
            <span className="font-semibold text-forest-700">{initialData.books.length}</span>
            <span>{locale === "zh" ? " 本书" : " books"}</span>
            {(initialQuery || initialGenre) && (
              <Link href="/books" className="ml-2 text-brand-500 hover:text-brand-600 font-medium">
                {locale === "zh" ? "× 清除筛选" : "× Clear filters"}
              </Link>
            )}
          </div>
        )}

        {/* Books Grid / List */}
        {initialData.books.length === 0 ? (
          <div className="text-center py-32">
            <div className="text-7xl mb-6">📚</div>
            <p className="text-gray-500 text-lg font-medium mb-2">
              {locale === "zh" ? "没有找到相关书籍" : "No books found"}
            </p>
            <p className="text-gray-400 text-sm mb-6">
              {locale === "zh" ? "试试其他关键词，或者添加一本新书" : "Try different keywords or add a new book"}
            </p>
            {session && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-2xl font-semibold text-sm hover:bg-brand-600 transition-colors"
              >
                <FiPlus />
                {locale === "zh" ? "添加书籍" : "Add a Book"}
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5"
          >
            {initialData.books.map((book) => (
              <motion.div
                key={book.id}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}
              >
                <Link href={`/books/${book.id}`} className="group block">
                  {/* Cover */}
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-card group-hover:shadow-card-hover transition-all duration-300 group-hover:-translate-y-2">
                    <BookCover
                      src={book.cover}
                      alt={book.titleZh || book.title}
                      title={book.titleZh || book.title}
                    />
                    {/* Genre badge */}
                    {book.genre && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 bg-black/50 text-white text-[10px] rounded-full backdrop-blur-sm font-medium">
                          {book.genre}
                        </span>
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                      <div className="flex items-center gap-3 text-white text-xs">
                        <span className="flex items-center gap-1">
                          <FiUsers className="text-[10px]" />
                          {book._count.userBooks}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiMessageSquare className="text-[10px]" />
                          {book._count.posts}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="mt-3 px-0.5">
                    <h3 className="font-semibold text-sm text-forest-900 line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors">
                      {locale === "zh" ? (book.titleZh || book.title) : book.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                      {locale === "zh" ? (book.authorZh || book.author) : book.author}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          /* List View */
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            className="space-y-3"
          >
            {initialData.books.map((book) => (
              <motion.div
                key={book.id}
                variants={{ hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3 } } }}
              >
                <Link href={`/books/${book.id}`}
                  className="group flex items-center gap-4 bg-white rounded-2xl p-4 border border-cream-200 hover:border-brand-200 hover:shadow-card transition-all"
                >
                  <div className="relative w-12 h-18 flex-shrink-0 rounded-lg overflow-hidden shadow-sm" style={{ height: "72px" }}>
                    <BookCover src={book.cover} alt={book.titleZh || book.title} title={book.titleZh || book.title} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-forest-900 text-sm group-hover:text-brand-600 transition-colors line-clamp-1">
                      {locale === "zh" ? (book.titleZh || book.title) : book.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {locale === "zh" ? (book.authorZh || book.author) : book.author}
                      {book.publishYear && ` · ${book.publishYear}`}
                    </p>
                    {book.genre && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-forest-50 text-forest-700 text-[10px] rounded-full font-medium">
                        {book.genre}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
                    <span className="flex items-center gap-1">
                      <FiUsers />
                      {book._count.userBooks}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiMessageSquare />
                      {book._count.posts}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Add Book Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="sticky top-0 bg-white rounded-t-3xl border-b border-cream-100 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center">
                    <FiBook className="text-brand-500 text-sm" />
                  </div>
                  <h2 className="font-serif text-lg font-bold text-forest-900">
                    {locale === "zh" ? "添加新书" : "Add New Book"}
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleAddBook} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <ModalInput
                    label={locale === "zh" ? "英文书名 *" : "Title *"}
                    value={newBook.title}
                    onChange={(v) => setNewBook({ ...newBook, title: v })}
                    required
                  />
                  <ModalInput
                    label={locale === "zh" ? "中文书名" : "Chinese Title"}
                    value={newBook.titleZh}
                    onChange={(v) => setNewBook({ ...newBook, titleZh: v })}
                  />
                  <ModalInput
                    label={locale === "zh" ? "作者 *" : "Author *"}
                    value={newBook.author}
                    onChange={(v) => setNewBook({ ...newBook, author: v })}
                    required
                  />
                  <ModalInput
                    label={locale === "zh" ? "作者（中文）" : "Author (Chinese)"}
                    value={newBook.authorZh}
                    onChange={(v) => setNewBook({ ...newBook, authorZh: v })}
                  />
                </div>
                <ModalInput
                  label={locale === "zh" ? "封面图片链接" : "Cover Image URL"}
                  value={newBook.cover}
                  onChange={(v) => setNewBook({ ...newBook, cover: v })}
                  placeholder="https://..."
                />
                <div className="grid grid-cols-2 gap-3">
                  <ModalInput
                    label={locale === "zh" ? "分类 / Genre" : "Genre"}
                    value={newBook.genre}
                    onChange={(v) => setNewBook({ ...newBook, genre: v })}
                    placeholder={locale === "zh" ? "如：文学、科技" : "e.g. Fiction, Tech"}
                  />
                  <ModalInput
                    label={locale === "zh" ? "出版年份" : "Publish Year"}
                    value={newBook.publishYear}
                    onChange={(v) => setNewBook({ ...newBook, publishYear: v })}
                    type="number"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    {locale === "zh" ? "简介" : "Description"}
                  </label>
                  <textarea
                    value={newBook.description}
                    onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                    rows={3}
                    placeholder={locale === "zh" ? "简短介绍这本书…" : "Brief description of the book…"}
                    className="w-full px-4 py-3 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none text-sm text-gray-700 placeholder-gray-300 transition-shadow"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 border border-cream-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 btn-brand py-3 rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    {submitting
                      ? (locale === "zh" ? "添加中…" : "Adding…")
                      : (locale === "zh" ? "添加书籍" : "Add Book")}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalInput({
  label, value, onChange, required, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm text-gray-700 placeholder-gray-300 transition-shadow"
      />
    </div>
  );
}
