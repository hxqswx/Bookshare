"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers, FiTrash2, FiShield, FiShieldOff,
  FiSearch, FiAlertTriangle, FiBook,
  FiMessageSquare, FiHeart,
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
  author: string; genre: string | null; publishYear: number | null;
  createdAt: string;
  _count: { userBooks: number; posts: number };
}
interface AdminPost {
  id: string; content: string; type: string; createdAt: string;
  user: { id: string; name: string };
  book: { id: string; title: string; titleZh: string | null } | null;
  _count: { comments: number; likes: number };
}
type DeleteTarget =
  | { kind: "user";  item: User }
  | { kind: "book";  item: AdminBook }
  | { kind: "post";  item: AdminPost };

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
  const [tab, setTab] = useState<"users" | "books" | "posts">("users");
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

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    if (tab === "books" && !booksFetched) fetchBooks();
    if (tab === "posts" && !postsFetched) fetchPosts();
  }, [tab, booksFetched, postsFetched, fetchBooks, fetchPosts]);

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

  /* ── Filter ── */
  const q = query.toLowerCase();
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(q) || (b.titleZh ?? "").toLowerCase().includes(q) ||
    b.author.toLowerCase().includes(q));
  const filteredPosts = posts.filter(p =>
    p.content.toLowerCase().includes(q) || p.user.name.toLowerCase().includes(q));

  /* ── Tabs config ── */
  const tabs = [
    { key: "users" as const, label: locale === "zh" ? "用户" : "Users",
      icon: <FiUsers />, count: users.length },
    { key: "books" as const, label: locale === "zh" ? "书籍" : "Books",
      icon: <FiBook />, count: books.length },
    { key: "posts" as const, label: locale === "zh" ? "帖子" : "Posts",
      icon: <FiMessageSquare />, count: posts.length },
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
                locale === "zh" ? "分类" : "Genre",
                locale === "zh" ? "数据" : "Stats",
                locale === "zh" ? "删除" : "Delete",
              ]} />
              {filteredBooks.length === 0 ? <Empty icon={<FiBook />} label={locale === "zh" ? "无书籍" : "No books"} /> : (
                <div className="divide-y divide-cream-100">
                  {filteredBooks.map((book, i) => (
                    <motion.div key={book.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-cream-50 transition-colors">
                      <div className="min-w-0">
                        <p className="font-semibold text-forest-900 text-sm truncate">
                          {locale === "zh" ? (book.titleZh || book.title) : book.title}
                        </p>
                        {locale === "zh" && book.titleZh && (
                          <p className="text-xs text-gray-400 truncate">{book.title}</p>
                        )}
                        <p className="text-xs text-gray-400">{book.author}{book.publishYear ? ` · ${book.publishYear}` : ""}</p>
                      </div>
                      <div className="w-24 text-right">
                        {book.genre && (
                          <span className="text-[11px] bg-forest-50 text-forest-700 px-2 py-0.5 rounded-full font-medium">
                            {book.genre}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs text-gray-400 w-16 justify-center">
                        <span className="flex items-center gap-0.5"><FiUsers className="text-[9px]" />{book._count.userBooks}</span>
                        <span className="flex items-center gap-0.5"><FiMessageSquare className="text-[9px]" />{book._count.posts}</span>
                      </div>
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
                {deleteTarget.kind === "user" && (locale === "zh" ? "确认删除用户？" : "Delete user?")}
                {deleteTarget.kind === "book" && (locale === "zh" ? "确认删除书籍？" : "Delete book?")}
                {deleteTarget.kind === "post" && (locale === "zh" ? "确认删除帖子？" : "Delete post?")}
              </h3>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                {deleteTarget.kind === "user" && (deleteTarget.item as User).name}
                {deleteTarget.kind === "book" && ((deleteTarget.item as AdminBook).titleZh || (deleteTarget.item as AdminBook).title)}
                {deleteTarget.kind === "post" && `"${(deleteTarget.item as AdminPost).content.slice(0, 40)}…"`}
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

