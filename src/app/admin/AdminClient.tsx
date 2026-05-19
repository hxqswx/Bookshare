"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers, FiTrash2, FiShield, FiShieldOff,
  FiSearch, FiAlertTriangle, FiBook,
  FiMessageSquare, FiHeart, FiStar, FiTag,
  FiEdit2, FiCheck, FiX, FiPlus, FiUploadCloud, FiLink,
} from "react-icons/fi";
import toast from "react-hot-toast";

/* ─── Types ─────────────────────────────────────────────── */
interface User {
  id: string; name: string; email: string; isAdmin: boolean;
  createdAt: string;
  _count: { posts: number; readingList: number };
}
interface AdminBook {
  id: string; title: string; titleZh: string | null;
  author: string; authorZh: string | null;
  cover: string | null;
  description: string | null; descriptionZh: string | null;
  genre: string | null; publishYear: number | null;
  isFeatured: boolean;
  fileUrl: string | null; fileType: string | null; readLink: string | null;
  createdAt: string;
  _count: { userBooks: number; posts: number };
}
interface AdminPost {
  id: string; content: string; type: string; createdAt: string;
  user: { id: string; name: string };
  book: { id: string; title: string; titleZh: string | null } | null;
  _count: { comments: number; likes: number };
}
interface AdminGenre {
  id: string; name: string; nameZh: string | null;
  order: number; bookCount: number;
}
type DeleteTarget =
  | { kind: "user";  item: User }
  | { kind: "book";  item: AdminBook }
  | { kind: "post";  item: AdminPost }
  | { kind: "genre"; item: AdminGenre };

/* ─── Avatar colour ──────────────────────────────────────── */
const GRAD = ["from-brand-400 to-brand-600","from-forest-400 to-forest-600",
  "from-purple-400 to-purple-600","from-sky-400 to-sky-600",
  "from-rose-400 to-rose-600","from-amber-400 to-amber-600"];
const grad = (name: string) => GRAD[(name.charCodeAt(0) || 0) % GRAD.length];

const TYPE_EMOJI: Record<string, string> = {
  share:"💬", review:"⭐", progress:"📊", quote:"💡",
};

/* ─── Component ──────────────────────────────────────────── */
export default function AdminClient({ currentUserId }: { currentUserId: string }) {
  const { locale } = useLanguage();
  const [tab, setTab] = useState<"users" | "books" | "posts" | "genres">("users");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* ── Users ── */
  const [users, setUsers]       = useState<User[]>([]);
  const [usersLoading, setUL]   = useState(true);

  /* ── Books ── */
  const [books, setBooks]       = useState<AdminBook[]>([]);
  const [booksLoading, setBL]   = useState(false);
  const [booksFetched, setBF]   = useState(false);

  /* ── Posts ── */
  const [posts, setPosts]       = useState<AdminPost[]>([]);
  const [postsLoading, setPL]   = useState(false);
  const [postsFetched, setPoF]  = useState(false);

  /* ── Genres ── */
  const [genres, setGenres]     = useState<AdminGenre[]>([]);
  const [genresLoading, setGL]  = useState(false);
  const [genresFetched, setGF]  = useState(false);
  // Inline add/edit state
  const [editingGenreId, setEditingGenreId] = useState<string | null>(null);
  const [editName, setEditName]   = useState("");
  const [editNameZh, setEditNameZh] = useState("");
  const [showAddGenre, setShowAddGenre] = useState(false);
  const [newGenreName, setNewGenreName]   = useState("");
  const [newGenreNameZh, setNewGenreNameZh] = useState("");
  const [genreSaving, setGenreSaving] = useState(false);
  // Book genre inline edit
  const [bookGenreMap, setBookGenreMap] = useState<Record<string, string>>({});

  // Book full edit modal
  const [editingBook, setEditingBook] = useState<AdminBook | null>(null);
  const [editBook, setEditBook] = useState<{
    title: string; titleZh: string; author: string; authorZh: string;
    cover: string; description: string; descriptionZh: string;
    genre: string; publishYear: string;
    fileUrl: string; fileType: string; readLink: string;
  } | null>(null);
  const [editUploadState, setEditUploadState] = useState<"idle"|"uploading"|"done"|"error">("idle");
  const [editUploadName, setEditUploadName] = useState("");
  const [bookSaving, setBookSaving] = useState(false);

  /* ── Fetch helpers ── */
  const fetchUsers = useCallback(async () => {
    setUL(true);
    try {
      const d = await fetch("/api/admin/users").then(r => r.json());
      setUsers(d);
    } catch { toast.error(locale === "zh" ? "加载失败" : "Failed to load"); }
    finally { setUL(false); }
  }, [locale]);

  const fetchBooks = useCallback(async () => {
    setBL(true);
    try {
      const d = await fetch("/api/admin/books").then(r => r.json());
      setBooks(d); setBF(true);
    } catch { toast.error(locale === "zh" ? "加载失败" : "Failed to load"); }
    finally { setBL(false); }
  }, [locale]);

  const fetchPosts = useCallback(async () => {
    setPL(true);
    try {
      const d = await fetch("/api/admin/posts").then(r => r.json());
      setPosts(d); setPoF(true);
    } catch { toast.error(locale === "zh" ? "加载失败" : "Failed to load"); }
    finally { setPL(false); }
  }, [locale]);

  const fetchGenres = useCallback(async () => {
    setGL(true);
    try {
      const d = await fetch("/api/admin/genres").then(r => r.json());
      setGenres(d); setGF(true);
    } catch { toast.error(locale === "zh" ? "加载失败" : "Failed to load"); }
    finally { setGL(false); }
  }, [locale]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    if (tab === "books"  && !booksFetched)  fetchBooks();
    if (tab === "books"  && !genresFetched) fetchGenres(); // needed for genre dropdown in books tab
    if (tab === "posts"  && !postsFetched)  fetchPosts();
    if (tab === "genres" && !genresFetched) fetchGenres();
  }, [tab, booksFetched, postsFetched, genresFetched, fetchBooks, fetchPosts, fetchGenres]);

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { kind, item } = deleteTarget;
    setActionLoading(item.id);
    try {
      const res = await fetch(`/api/admin/${kind}s/${item.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const data = await res.json();

      if (kind === "user") {
        setUsers(p => p.filter(u => u.id !== item.id));
        toast.success(locale === "zh" ? "用户已删除" : "User deleted");
        if (data.isSelf) { await signOut({ callbackUrl: "/" }); return; }
      } else if (kind === "book") {
        setBooks(p => p.filter(b => b.id !== item.id));
        toast.success(locale === "zh" ? "书籍已删除" : "Book deleted");
      } else if (kind === "genre") {
        setGenres(p => p.filter(g => g.id !== item.id));
        toast.success(locale === "zh" ? "分类已删除" : "Genre deleted");
      } else {
        setPosts(p => p.filter(p2 => p2.id !== item.id));
        toast.success(locale === "zh" ? "帖子已删除" : "Post deleted");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : (locale === "zh" ? "操作失败" : "Failed"));
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  };

  /* ── Toggle admin ── */
  const toggleAdmin = async (user: User) => {
    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !user.isAdmin }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setUsers(p => p.map(u => u.id === user.id ? { ...u, isAdmin: !u.isAdmin } : u));
      toast.success(user.isAdmin
        ? (locale === "zh" ? "已撤销管理员" : "Admin revoked")
        : (locale === "zh" ? "已设为管理员" : "Admin granted"));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : (locale === "zh" ? "操作失败" : "Failed"));
    } finally { setActionLoading(null); }
  };

  /* ── Toggle featured ── */
  const toggleFeatured = async (book: AdminBook) => {
    setActionLoading(book.id);
    try {
      const res = await fetch(`/api/admin/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !book.isFeatured }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setBooks(p => p.map(b => b.id === book.id ? { ...b, isFeatured: !b.isFeatured } : b));
      toast.success(book.isFeatured
        ? (locale === "zh" ? "已取消推荐" : "Removed from featured")
        : (locale === "zh" ? "已设为推荐" : "Marked as featured"));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : (locale === "zh" ? "操作失败" : "Failed"));
    } finally { setActionLoading(null); }
  };

  /* ── Genre CRUD ── */
  const handleAddGenre = async () => {
    if (!newGenreName.trim()) return;
    setGenreSaving(true);
    try {
      const res = await fetch("/api/admin/genres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGenreName.trim(), nameZh: newGenreNameZh.trim() || null }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const g = await res.json();
      setGenres(p => [...p, g]);
      setShowAddGenre(false); setNewGenreName(""); setNewGenreNameZh("");
      toast.success(locale === "zh" ? "分类已添加" : "Genre added");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : (locale === "zh" ? "添加失败" : "Failed"));
    } finally { setGenreSaving(false); }
  };

  const handleSaveGenreEdit = async (id: string) => {
    if (!editName.trim()) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/genres/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), nameZh: editNameZh.trim() || null }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const updated = await res.json();
      setGenres(p => p.map(g => g.id === id ? { ...g, ...updated } : g));
      setEditingGenreId(null);
      toast.success(locale === "zh" ? "分类已更新" : "Genre updated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : (locale === "zh" ? "更新失败" : "Failed"));
    } finally { setActionLoading(null); }
  };

  /* ── Inline book genre update ── */
  const handleUpdateBookGenre = async (bookId: string, genre: string) => {
    setBookGenreMap(m => ({ ...m, [bookId]: genre }));
    setBooks(p => p.map(b => b.id === bookId ? { ...b, genre: genre || null } : b));
    try {
      await fetch(`/api/admin/books/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre }),
      });
      toast.success(locale === "zh" ? "分类已更新" : "Genre updated");
    } catch {
      toast.error(locale === "zh" ? "更新失败" : "Failed");
    } finally {
      setBookGenreMap(m => { const n = { ...m }; delete n[bookId]; return n; });
    }
  };

  /* ── Open / save book edit modal ── */
  const openEditBook = (book: AdminBook) => {
    setEditingBook(book);
    setEditBook({
      title: book.title, titleZh: book.titleZh ?? "",
      author: book.author, authorZh: book.authorZh ?? "",
      cover: book.cover ?? "", description: book.description ?? "",
      descriptionZh: book.descriptionZh ?? "",
      genre: book.genre ?? "", publishYear: book.publishYear?.toString() ?? "",
      fileUrl: book.fileUrl ?? "", fileType: book.fileType ?? "",
      readLink: book.readLink ?? "",
    });
    setEditUploadState("idle");
    setEditUploadName(book.fileUrl ? (book.fileUrl.split("/").pop() ?? "") : "");
  };

  const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB

  const handleEditFileUpload = async (file: File) => {
    if (!editBook) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(
        locale === "zh"
          ? "文件过大（最大 4 MB）。超大文件请使用外部链接。"
          : "File too large (max 4 MB). Use an external link for larger files."
      );
      return;
    }
    setEditUploadState("uploading");
    setEditUploadName(file.name);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5 * 60 * 1000);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? (locale === "zh" ? "上传失败" : "Upload failed"));
      setEditBook(b => b ? { ...b, fileUrl: data.url, fileType: data.fileType } : b);
      setEditUploadState("done");
    } catch (err) {
      setEditUploadState("error");
      const msg = err instanceof Error ? err.message : (locale === "zh" ? "上传失败，请重试" : "Upload failed");
      toast.error(msg);
    } finally {
      clearTimeout(timer);
    }
  };

  const handleSaveBookEdit = async () => {
    if (!editingBook || !editBook) return;
    setBookSaving(true);
    try {
      const res = await fetch(`/api/admin/books/${editingBook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editBook.title,
          titleZh: editBook.titleZh || null,
          author: editBook.author,
          authorZh: editBook.authorZh || null,
          cover: editBook.cover || null,
          description: editBook.description || null,
          descriptionZh: editBook.descriptionZh || null,
          genre: editBook.genre || null,
          publishYear: editBook.publishYear ? parseInt(editBook.publishYear) : null,
          fileUrl: editBook.fileUrl || null,
          fileType: editBook.fileType || null,
          readLink: editBook.readLink || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const updated = await res.json();
      setBooks(p => p.map(b => b.id === editingBook.id ? { ...b, ...updated } : b));
      setEditingBook(null);
      setEditBook(null);
      toast.success(locale === "zh" ? "书籍已更新" : "Book updated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : (locale === "zh" ? "保存失败" : "Failed"));
    } finally { setBookSaving(false); }
  };

  /* ── Filter ── */
  const q = query.toLowerCase();
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(q) || (b.titleZh ?? "").toLowerCase().includes(q) ||
    b.author.toLowerCase().includes(q));
  const filteredPosts = posts.filter(p =>
    p.content.toLowerCase().includes(q) || p.user.name.toLowerCase().includes(q));
  const filteredGenres = genres.filter(g =>
    g.name.toLowerCase().includes(q) || (g.nameZh ?? "").toLowerCase().includes(q));

  /* ── Tabs config ── */
  const tabs = [
    { key: "users"  as const, label: locale === "zh" ? "用户" : "Users",
      icon: <FiUsers />, count: users.length },
    { key: "books"  as const, label: locale === "zh" ? "书籍" : "Books",
      icon: <FiBook />, count: books.length },
    { key: "posts"  as const, label: locale === "zh" ? "帖子" : "Posts",
      icon: <FiMessageSquare />, count: posts.length },
    { key: "genres" as const, label: locale === "zh" ? "分类" : "Genres",
      icon: <FiTag />, count: genres.length },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-forest-700 to-forest-500 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FiShield className="text-xl" />
            </div>
            <div>
              <p className="text-forest-200 text-xs font-semibold uppercase tracking-widest">
                {locale === "zh" ? "后台管理" : "Admin Panel"}
              </p>
              <h1 className="font-serif text-2xl font-bold">
                {locale === "zh" ? "内容管理" : "Content Management"}
              </h1>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1">
            {tabs.map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setQuery(""); }}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl transition-all ${
                  tab === t.key
                    ? "bg-[#FFFDF9] text-forest-800"
                    : "text-forest-100 hover:bg-white/10"
                }`}>
                {t.icon}
                {t.label}
                {t.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    tab === t.key ? "bg-forest-100 text-forest-700" : "bg-white/20 text-white"
                  }`}>{t.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Search */}
        <div className="relative mb-5">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder={
              tab === "users" ? (locale === "zh" ? "搜索用户名或邮箱…" : "Search name or email…") :
              tab === "books" ? (locale === "zh" ? "搜索书名或作者…" : "Search title or author…") :
                               (locale === "zh" ? "搜索内容或用户…" : "Search content or user…")
            }
            className="input pl-11" />
        </div>

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          usersLoading ? <Spinner /> : (
            <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-card">
              <TableHeader cols={[
                locale === "zh" ? "用户" : "User",
                locale === "zh" ? "内容" : "Activity",
                locale === "zh" ? "权限" : "Role",
                locale === "zh" ? "操作" : "Actions",
              ]} />
              {filteredUsers.length === 0 ? <Empty icon={<FiUsers />} label={locale === "zh" ? "无用户" : "No users"} /> : (
                <div className="divide-y divide-cream-100">
                  {filteredUsers.map((user, i) => (
                    <motion.div key={user.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.025 }}
                      className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-cream-50 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad(user.name)} flex-shrink-0 flex items-center justify-center text-white text-xs font-bold`}>
                          {user.name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-forest-900 text-sm truncate">{user.name}</p>
                            {user.id === currentUserId && <Badge color="brand">{locale === "zh" ? "你" : "You"}</Badge>}
                            {user.isAdmin && <Badge color="forest">Admin</Badge>}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          <p className="text-[10px] text-gray-300">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-xs text-gray-400 w-14">
                        <span className="flex items-center gap-1"><FiMessageSquare className="text-[9px]" />{user._count.posts}</span>
                        <span className="flex items-center gap-1"><FiBook className="text-[9px]" />{user._count.readingList}</span>
                      </div>
                      <div className="flex justify-center w-10">
                        {user.id !== currentUserId && (
                          <IconBtn loading={actionLoading === user.id}
                            title={user.isAdmin ? (locale === "zh" ? "撤销管理员" : "Revoke admin") : (locale === "zh" ? "设为管理员" : "Grant admin")}
                            onClick={() => toggleAdmin(user)}
                            className={user.isAdmin ? "text-forest-600 hover:bg-forest-50" : "text-gray-300 hover:bg-gray-100 hover:text-forest-400"}>
                            {user.isAdmin ? <FiShield /> : <FiShieldOff />}
                          </IconBtn>
                        )}
                      </div>
                      <div className="flex justify-center w-10">
                        <IconBtn loading={actionLoading === user.id}
                          title={locale === "zh" ? "删除用户" : "Delete user"}
                          onClick={() => setDeleteTarget({ kind: "user", item: user })}
                          className={`text-gray-300 hover:text-red-500 hover:bg-red-50 ${user.id === currentUserId ? "border border-red-200" : ""}`}>
                          <FiTrash2 />
                        </IconBtn>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* ── BOOKS TAB ── */}
        {tab === "books" && (
          booksLoading ? <Spinner /> : (
            <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-card">
              <TableHeader cols={[
                locale === "zh" ? "书名" : "Title",
                locale === "zh" ? "分类（可修改）" : "Genre (editable)",
                locale === "zh" ? "数据" : "Stats",
                locale === "zh" ? "推荐" : "Featured",
                locale === "zh" ? "编辑" : "Edit",
                locale === "zh" ? "删除" : "Delete",
              ]} />
              {filteredBooks.length === 0 ? <Empty icon={<FiBook />} label={locale === "zh" ? "无书籍" : "No books"} /> : (
                <div className="divide-y divide-cream-100">
                  {filteredBooks.map((book, i) => (
                    <motion.div key={book.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 items-center px-5 py-3.5 hover:bg-cream-50 transition-colors ${book.isFeatured ? "bg-amber-50/60" : ""}`}>
                      {/* Title */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-forest-900 text-sm truncate">
                            {locale === "zh" ? (book.titleZh || book.title) : book.title}
                          </p>
                          {book.isFeatured && (
                            <span className="flex-shrink-0 text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-semibold">
                              ⭐ {locale === "zh" ? "推荐" : "Featured"}
                            </span>
                          )}
                        </div>
                        {locale === "zh" && book.titleZh && (
                          <p className="text-xs text-gray-400 truncate">{book.title}</p>
                        )}
                        <p className="text-xs text-gray-400">{book.author}{book.publishYear ? ` · ${book.publishYear}` : ""}</p>
                      </div>

                      {/* Genre dropdown (inline edit) */}
                      <div className="w-36">
                        <select
                          value={bookGenreMap[book.id] ?? (book.genre || "")}
                          onChange={e => handleUpdateBookGenre(book.id, e.target.value)}
                          disabled={!!actionLoading}
                          className="w-full text-[11px] border border-cream-200 rounded-lg px-2 py-1.5 bg-white text-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-300 appearance-none cursor-pointer hover:border-forest-300 transition-colors"
                        >
                          <option value="">{locale === "zh" ? "无分类" : "No genre"}</option>
                          {genres.map(g => (
                            <option key={g.id} value={g.name}>
                              {locale === "zh" ? (g.nameZh || g.name) : g.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-3 text-xs text-gray-400 w-14 justify-center">
                        <span className="flex items-center gap-0.5"><FiUsers className="text-[9px]" />{book._count.userBooks}</span>
                        <span className="flex items-center gap-0.5"><FiMessageSquare className="text-[9px]" />{book._count.posts}</span>
                      </div>

                      {/* Featured toggle */}
                      <div className="flex justify-center w-10">
                        <IconBtn loading={actionLoading === book.id}
                          title={book.isFeatured
                            ? (locale === "zh" ? "取消推荐" : "Remove featured")
                            : (locale === "zh" ? "设为推荐" : "Mark featured")}
                          onClick={() => toggleFeatured(book)}
                          className={book.isFeatured
                            ? "text-amber-500 hover:bg-amber-50"
                            : "text-gray-300 hover:text-amber-400 hover:bg-amber-50"}>
                          <FiStar className={book.isFeatured ? "fill-amber-400" : ""} />
                        </IconBtn>
                      </div>

                      {/* Edit */}
                      <div className="flex justify-center w-10">
                        <IconBtn loading={false}
                          title={locale === "zh" ? "编辑书籍" : "Edit book"}
                          onClick={() => openEditBook(book)}
                          className="text-gray-400 hover:text-forest-600 hover:bg-forest-50">
                          <FiEdit2 />
                        </IconBtn>
                      </div>

                      {/* Delete */}
                      <div className="flex justify-center w-10">
                        <IconBtn loading={actionLoading === book.id}
                          title={locale === "zh" ? "删除书籍" : "Delete book"}
                          onClick={() => setDeleteTarget({ kind: "book", item: book })}
                          className="text-gray-300 hover:text-red-500 hover:bg-red-50">
                          <FiTrash2 />
                        </IconBtn>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* ── POSTS TAB ── */}
        {tab === "posts" && (
          postsLoading ? <Spinner /> : (
            <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-card">
              <TableHeader cols={[
                locale === "zh" ? "内容" : "Content",
                locale === "zh" ? "互动" : "Engagement",
                locale === "zh" ? "删除" : "Delete",
              ]} />
              {filteredPosts.length === 0 ? <Empty icon={<FiMessageSquare />} label={locale === "zh" ? "无帖子" : "No posts"} /> : (
                <div className="divide-y divide-cream-100">
                  {filteredPosts.map((post, i) => (
                    <motion.div key={post.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-4 hover:bg-cream-50 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${grad(post.user.name)} flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold`}>
                            {post.user.name[0]?.toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-forest-800">{post.user.name}</span>
                          <span className="text-xs">{TYPE_EMOJI[post.type] ?? "💬"}</span>
                          {post.book && (
                            <span className="text-[10px] bg-cream-100 text-gray-500 px-1.5 py-0.5 rounded-full truncate max-w-[120px]">
                              {locale === "zh" ? (post.book.titleZh || post.book.title) : post.book.title}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-300">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-400 w-16 justify-center">
                        <span className="flex items-center gap-0.5"><FiHeart className="text-[9px]" />{post._count.likes}</span>
                        <span className="flex items-center gap-0.5"><FiMessageSquare className="text-[9px]" />{post._count.comments}</span>
                      </div>
                      <div className="flex justify-center w-10">
                        <IconBtn loading={actionLoading === post.id}
                          title={locale === "zh" ? "删除帖子" : "Delete post"}
                          onClick={() => setDeleteTarget({ kind: "post", item: post })}
                          className="text-gray-300 hover:text-red-500 hover:bg-red-50">
                          <FiTrash2 />
                        </IconBtn>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>

        {/* ── GENRES TAB ── */}
        {tab === "genres" && (
          genresLoading ? <Spinner /> : (
            <div className="space-y-4">
              {/* Add genre form */}
              {showAddGenre ? (
                <div className="bg-white rounded-2xl border border-brand-200 p-5 shadow-card">
                  <p className="text-sm font-semibold text-forest-900 mb-3">
                    {locale === "zh" ? "添加新分类" : "Add New Genre"}
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    <input
                      autoFocus
                      value={newGenreName}
                      onChange={e => setNewGenreName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddGenre()}
                      placeholder={locale === "zh" ? "英文名称 (必填)" : "English name (required)"}
                      className="input flex-1 min-w-40 text-sm"
                    />
                    <input
                      value={newGenreNameZh}
                      onChange={e => setNewGenreNameZh(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddGenre()}
                      placeholder={locale === "zh" ? "中文名称" : "Chinese name"}
                      className="input flex-1 min-w-32 text-sm"
                    />
                    <button onClick={handleAddGenre} disabled={genreSaving || !newGenreName.trim()}
                      className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                      {genreSaving
                        ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : <FiCheck />}
                      {locale === "zh" ? "保存" : "Save"}
                    </button>
                    <button onClick={() => { setShowAddGenre(false); setNewGenreName(""); setNewGenreNameZh(""); }}
                      className="px-4 py-2 border border-cream-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50">
                      <FiX />
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddGenre(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200 rounded-xl text-sm font-semibold transition-colors">
                  <FiPlus /> {locale === "zh" ? "添加分类" : "Add Genre"}
                </button>
              )}

              {/* Genre list */}
              <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-card">
                <TableHeader cols={[
                  locale === "zh" ? "英文名称" : "English Name",
                  locale === "zh" ? "中文名称" : "Chinese Name",
                  locale === "zh" ? "书籍数" : "Books",
                  locale === "zh" ? "操作" : "Actions",
                ]} />
                {filteredGenres.length === 0
                  ? <Empty icon={<FiTag />} label={locale === "zh" ? "无分类" : "No genres"} />
                  : (
                    <div className="divide-y divide-cream-100">
                      {filteredGenres.map((genre, i) => (
                        <motion.div key={genre.id}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-cream-50 transition-colors">

                          {editingGenreId === genre.id ? (
                            /* Edit row */
                            <>
                              <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSaveGenreEdit(genre.id)}
                                className="input text-sm py-1.5 px-3" />
                              <input value={editNameZh} onChange={e => setEditNameZh(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSaveGenreEdit(genre.id)}
                                className="input text-sm py-1.5 px-3"
                                placeholder={locale === "zh" ? "中文名称" : "Chinese name"} />
                              <span className="text-xs text-gray-400 text-center">{genre.bookCount}</span>
                              <div className="flex gap-1">
                                <IconBtn loading={actionLoading === genre.id}
                                  title={locale === "zh" ? "保存" : "Save"}
                                  onClick={() => handleSaveGenreEdit(genre.id)}
                                  className="text-brand-500 hover:bg-brand-50">
                                  <FiCheck />
                                </IconBtn>
                                <IconBtn loading={false}
                                  title={locale === "zh" ? "取消" : "Cancel"}
                                  onClick={() => setEditingGenreId(null)}
                                  className="text-gray-400 hover:bg-gray-100">
                                  <FiX />
                                </IconBtn>
                              </div>
                            </>
                          ) : (
                            /* Display row */
                            <>
                              <p className="font-medium text-forest-900 text-sm">{genre.name}</p>
                              <p className="text-sm text-gray-500">{genre.nameZh || <span className="text-gray-300 italic text-xs">—</span>}</p>
                              <span className="text-xs text-center px-2 py-0.5 bg-forest-50 text-forest-700 rounded-full font-medium w-12">
                                {genre.bookCount}
                              </span>
                              <div className="flex gap-1">
                                <IconBtn loading={actionLoading === genre.id}
                                  title={locale === "zh" ? "编辑" : "Edit"}
                                  onClick={() => {
                                    setEditingGenreId(genre.id);
                                    setEditName(genre.name);
                                    setEditNameZh(genre.nameZh || "");
                                  }}
                                  className="text-gray-400 hover:text-forest-600 hover:bg-forest-50">
                                  <FiEdit2 />
                                </IconBtn>
                                <IconBtn loading={actionLoading === genre.id}
                                  title={locale === "zh" ? "删除" : "Delete"}
                                  onClick={() => setDeleteTarget({ kind: "genre", item: genre })}
                                  className="text-gray-300 hover:text-red-500 hover:bg-red-50">
                                  <FiTrash2 />
                                </IconBtn>
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )
        )}

      {/* ── Edit Book Modal ── */}
      <AnimatePresence>
        {editingBook && editBook && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setEditingBook(null); }}>
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">

              {/* Header */}
              <div className="sticky top-0 bg-white rounded-t-3xl border-b border-cream-100 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-forest-50 rounded-xl flex items-center justify-center">
                    <FiBook className="text-forest-600 text-sm" />
                  </div>
                  <h2 className="font-serif text-lg font-bold text-forest-900">
                    {locale === "zh" ? "编辑书籍" : "Edit Book"}
                  </h2>
                </div>
                <button onClick={() => setEditingBook(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
                  <FiX />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Title / Author grid */}
                <div className="grid grid-cols-2 gap-3">
                  <AdminInput label={locale === "zh" ? "英文书名 *" : "Title *"}
                    value={editBook.title} onChange={v => setEditBook(b => b ? { ...b, title: v } : b)} required />
                  <AdminInput label={locale === "zh" ? "中文书名" : "Chinese Title"}
                    value={editBook.titleZh} onChange={v => setEditBook(b => b ? { ...b, titleZh: v } : b)} />
                  <AdminInput label={locale === "zh" ? "作者 *" : "Author *"}
                    value={editBook.author} onChange={v => setEditBook(b => b ? { ...b, author: v } : b)} required />
                  <AdminInput label={locale === "zh" ? "作者（中文）" : "Author (ZH)"}
                    value={editBook.authorZh} onChange={v => setEditBook(b => b ? { ...b, authorZh: v } : b)} />
                </div>

                {/* Cover URL */}
                <AdminInput label={locale === "zh" ? "封面图片链接" : "Cover Image URL"}
                  value={editBook.cover} onChange={v => setEditBook(b => b ? { ...b, cover: v } : b)}
                  placeholder="https://..." />

                {/* Genre + Year */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                      {locale === "zh" ? "分类" : "Genre"}
                    </label>
                    <select value={editBook.genre}
                      onChange={e => setEditBook(b => b ? { ...b, genre: e.target.value } : b)}
                      className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm text-gray-700 bg-white appearance-none">
                      <option value="">{locale === "zh" ? "无分类" : "No genre"}</option>
                      {genres.map(g => (
                        <option key={g.id} value={g.name}>
                          {locale === "zh" ? (g.nameZh || g.name) : g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <AdminInput label={locale === "zh" ? "出版年份" : "Publish Year"}
                    value={editBook.publishYear} type="number"
                    onChange={v => setEditBook(b => b ? { ...b, publishYear: v } : b)} placeholder="2024" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    {locale === "zh" ? "简介（英文）" : "Description"}
                  </label>
                  <textarea rows={2} value={editBook.description}
                    onChange={e => setEditBook(b => b ? { ...b, description: e.target.value } : b)}
                    className="w-full px-4 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none text-sm text-gray-700" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    {locale === "zh" ? "简介（中文）" : "Description (ZH)"}
                  </label>
                  <textarea rows={2} value={editBook.descriptionZh}
                    onChange={e => setEditBook(b => b ? { ...b, descriptionZh: e.target.value } : b)}
                    className="w-full px-4 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none text-sm text-gray-700" />
                </div>

                {/* ── Reading source ── */}
                <div className="border-t border-cream-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {locale === "zh" ? "📖 阅读来源" : "📖 Reading Source"}
                  </p>

                  {/* Current file status */}
                  {editBook.fileUrl ? (
                    <div className="flex items-center gap-3 bg-forest-50 border border-forest-100 rounded-xl px-4 py-2.5 mb-3">
                      <FiCheck className="text-forest-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-forest-800">
                          {editBook.fileType?.toUpperCase() ?? "FILE"}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">{editBook.fileUrl}</p>
                      </div>
                      <button onClick={() => setEditBook(b => b ? { ...b, fileUrl: "", fileType: "" } : b)}
                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                        <FiX size={14} />
                      </button>
                    </div>
                  ) : null}

                  {/* Upload new file */}
                  <label className={`flex flex-col items-center gap-2 px-4 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    editUploadState === "uploading" ? "border-brand-300 bg-brand-50/30" :
                    editUploadState === "done" ? "border-forest-400 bg-forest-50" :
                    editUploadState === "error" ? "border-red-300 bg-red-50" :
                    "border-cream-200 bg-gray-50 hover:border-brand-300"}`}>
                    {editUploadState === "uploading" ? (
                      <><div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-gray-500">{locale === "zh" ? "上传中…" : "Uploading…"}</span></>
                    ) : editUploadState === "done" ? (
                      <><FiCheck className="text-forest-500 text-lg" />
                      <span className="text-xs text-forest-700 font-medium">{editUploadName}</span>
                      <span className="text-[11px] text-gray-400">{locale === "zh" ? "已更换" : "Replaced"}</span></>
                    ) : (
                      <><FiUploadCloud className="text-xl text-gray-400" />
                      <span className="text-xs text-gray-600 font-medium">
                        {locale === "zh" ? "上传新文件（PDF / EPUB / TXT）" : "Upload new file (PDF / EPUB / TXT)"}
                      </span></>
                    )}
                    <input type="file" className="hidden"
                      accept=".pdf,.epub,.txt,application/pdf,application/epub+zip,text/plain"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleEditFileUpload(f); }} />
                  </label>

                  {/* External link */}
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <FiLink className="text-[11px]" />
                      {locale === "zh" ? "外部链接 / Kindle" : "External Link / Kindle"}
                    </label>
                    <input type="url" value={editBook.readLink}
                      onChange={e => setEditBook(b => b ? { ...b, readLink: e.target.value } : b)}
                      placeholder="https://www.amazon.co.uk/dp/..."
                      className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm text-gray-700 placeholder-gray-300" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
                  <button onClick={() => setEditingBook(null)}
                    className="flex-1 py-3 border border-cream-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 text-sm">
                    {locale === "zh" ? "取消" : "Cancel"}
                  </button>
                  <button onClick={handleSaveBookEdit} disabled={bookSaving || !editBook.title || !editBook.author}
                    className="flex-1 py-3 bg-forest-600 hover:bg-forest-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {bookSaving
                      ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <FiCheck />}
                    {locale === "zh" ? "保存更改" : "Save Changes"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FiAlertTriangle className="text-2xl text-red-500" />
              </div>
              <h3 className="font-serif text-xl font-bold text-forest-900 mb-2">
                {deleteTarget.kind === "user"  && (locale === "zh" ? "确认删除用户？" : "Delete user?")}
                {deleteTarget.kind === "book"  && (locale === "zh" ? "确认删除书籍？" : "Delete book?")}
                {deleteTarget.kind === "post"  && (locale === "zh" ? "确认删除帖子？" : "Delete post?")}
                {deleteTarget.kind === "genre" && (locale === "zh" ? "确认删除分类？" : "Delete genre?")}
              </h3>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                {deleteTarget.kind === "user"  && (deleteTarget.item as User).name}
                {deleteTarget.kind === "book"  && ((deleteTarget.item as AdminBook).titleZh || (deleteTarget.item as AdminBook).title)}
                {deleteTarget.kind === "post"  && `"${(deleteTarget.item as AdminPost).content.slice(0, 40)}…"`}
                {deleteTarget.kind === "genre" && (deleteTarget.item as AdminGenre).name}
              </p>
              {/* Extra warning if admin is deleting themselves */}
              {deleteTarget.kind === "user" && (deleteTarget.item as User).id === currentUserId && (
                <p className="text-xs text-red-500 font-semibold mb-2 bg-red-50 rounded-xl py-2 px-3">
                  {locale === "zh" ? "⚠️ 你将删除自己的账号并退出登录" : "⚠️ You will delete your own account and be signed out"}
                </p>
              )}
              <p className="text-sm text-gray-400 mb-7">
                {locale === "zh" ? "此操作不可撤销，相关数据将永久删除。" : "This action is permanent and cannot be undone."}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 border border-cream-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 text-sm">
                  {locale === "zh" ? "取消" : "Cancel"}
                </button>
                <button onClick={handleDelete} disabled={!!actionLoading}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                  {actionLoading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <FiTrash2 />}
                  {locale === "zh" ? "确认删除" : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Small helpers ──────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex justify-center py-24">
      <span className="w-8 h-8 border-2 border-forest-200 border-t-forest-600 rounded-full animate-spin" />
    </div>
  );
}

function Empty({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="py-16 text-center text-gray-400">
      <div className="text-4xl mb-3 flex justify-center text-gray-200">{icon}</div>
      <p className="text-sm">{label}</p>
    </div>
  );
}

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <div className={`grid gap-4 px-5 py-3 bg-gray-50 border-b border-cream-200 text-xs font-semibold text-gray-500 uppercase tracking-wide`}
      style={{ gridTemplateColumns: `1fr ${cols.slice(1).map(() => "auto").join(" ")}` }}>
      {cols.map((c, i) => <span key={i} className={i > 0 ? "text-center" : ""}>{c}</span>)}
    </div>
  );
}

function IconBtn({ children, onClick, loading, title, className = "" }: {
  children: React.ReactNode; onClick: () => void; loading: boolean;
  title: string; className?: string;
}) {
  return (
    <button onClick={onClick} disabled={loading} title={title}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${className}`}>
      {loading
        ? <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin block" />
        : children}
    </button>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: "brand" | "forest" }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
      color === "brand" ? "bg-brand-100 text-brand-700" : "bg-forest-100 text-forest-700"
    }`}>{children}</span>
  );
}

function AdminInput({ label, value, onChange, required, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm text-gray-700 placeholder-gray-300 transition-shadow"
      />
    </div>
  );
}

