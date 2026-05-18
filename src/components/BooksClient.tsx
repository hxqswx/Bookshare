"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { FiSearch, FiBook, FiUsers, FiMessageSquare, FiPlus, FiX } from "react-icons/fi";
import toast from "react-hot-toast";

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
      router.refresh();
    } catch {
      toast.error(locale === "zh" ? "添加失败，请重试" : "Failed to add book");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-extrabold">{t.books.title}</h1>
              <p className="text-white/80 mt-2">
                {initialData.books.length}{" "}
                {locale === "zh" ? "本书等你来读" : "books waiting for you"}
              </p>
            </div>
            {session && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-white text-primary-600 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
              >
                <FiPlus />
                {locale === "zh" ? "添加书籍" : "Add Book"}
              </button>
            )}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.books.search}
                className="w-full pl-11 pr-4 py-3.5 bg-white rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-md"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-colors border border-white/30"
            >
              {locale === "zh" ? "搜索" : "Search"}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Genre filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => handleGenre("")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              genre === ""
                ? "bg-primary-500 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-600"
            }`}
          >
            {t.books.all_genres}
          </button>
          {initialData.genres.map((g) => (
            <button
              key={g}
              onClick={() => handleGenre(g)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                genre === g
                  ? "bg-primary-500 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-600"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Books Grid */}
        {initialData.books.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-500 text-lg">
              {locale === "zh" ? "没有找到相关书籍" : "No books found"}
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5"
          >
            {initialData.books.map((book) => (
              <motion.div
                key={book.id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              >
                <Link href={`/books/${book.id}`} className="group block">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 book-shadow">
                    <Image
                      src={book.cover || `https://via.placeholder.com/200x300/f19340/ffffff?text=${encodeURIComponent(book.title)}`}
                      alt={book.titleZh || book.title}
                      fill
                      className="object-cover"
                    />
                    {book.genre && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 bg-black/50 text-white text-[10px] rounded-full backdrop-blur-sm">
                          {book.genre}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 px-1">
                    <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors">
                      {locale === "zh" ? (book.titleZh || book.title) : book.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {locale === "zh" ? (book.authorZh || book.author) : book.author}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
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
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Add Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FiBook className="text-primary-500" />
                  {locale === "zh" ? "添加新书" : "Add New Book"}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleAddBook} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label={locale === "zh" ? "英文书名 *" : "Title *"}
                    value={newBook.title}
                    onChange={(v) => setNewBook({ ...newBook, title: v })}
                    required
                  />
                  <InputField
                    label={locale === "zh" ? "中文书名" : "Chinese Title"}
                    value={newBook.titleZh}
                    onChange={(v) => setNewBook({ ...newBook, titleZh: v })}
                  />
                  <InputField
                    label={locale === "zh" ? "作者 *" : "Author *"}
                    value={newBook.author}
                    onChange={(v) => setNewBook({ ...newBook, author: v })}
                    required
                  />
                  <InputField
                    label={locale === "zh" ? "中文作者名" : "Author (Chinese)"}
                    value={newBook.authorZh}
                    onChange={(v) => setNewBook({ ...newBook, authorZh: v })}
                  />
                </div>
                <InputField
                  label={locale === "zh" ? "封面图片 URL" : "Cover Image URL"}
                  value={newBook.cover}
                  onChange={(v) => setNewBook({ ...newBook, cover: v })}
                  placeholder="https://..."
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label={locale === "zh" ? "分类" : "Genre"}
                    value={newBook.genre}
                    onChange={(v) => setNewBook({ ...newBook, genre: v })}
                  />
                  <InputField
                    label={locale === "zh" ? "出版年份" : "Publish Year"}
                    value={newBook.publishYear}
                    onChange={(v) => setNewBook({ ...newBook, publishYear: v })}
                    type="number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === "zh" ? "简介" : "Description"}
                  </label>
                  <textarea
                    value={newBook.description}
                    onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:shadow-md transition-all disabled:opacity-60"
                  >
                    {submitting
                      ? locale === "zh" ? "添加中..." : "Adding..."
                      : locale === "zh" ? "添加书籍" : "Add Book"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function InputField({
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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
      />
    </div>
  );
}
