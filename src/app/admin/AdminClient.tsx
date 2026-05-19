"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers, FiTrash2, FiShield, FiShieldOff,
  FiSearch, FiAlertTriangle, FiX, FiBook, FiMessageSquare,
} from "react-icons/fi";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  _count: { posts: number; readingList: number };
}

export default function AdminClient({ currentUserId }: { currentUserId: string }) {
  const { locale } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data);
    } catch {
      toast.error(locale === "zh" ? "加载失败" : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      toast.success(locale === "zh" ? "用户已删除" : "User deleted");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : (locale === "zh" ? "删除失败" : "Delete failed"));
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  };

  const toggleAdmin = async (user: User) => {
    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !user.isAdmin }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isAdmin: !u.isAdmin } : u));
      toast.success(
        user.isAdmin
          ? (locale === "zh" ? "已撤销管理员权限" : "Admin revoked")
          : (locale === "zh" ? "已设为管理员" : "Admin granted")
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : (locale === "zh" ? "操作失败" : "Operation failed"));
    } finally {
      setActionLoading(null);
    }
  };

  const adminCount = users.filter(u => u.isAdmin).length;

  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-forest-700 to-forest-500 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FiShield className="text-xl" />
            </div>
            <div>
              <p className="text-forest-200 text-xs font-semibold uppercase tracking-widest">
                {locale === "zh" ? "后台管理" : "Admin Panel"}
              </p>
              <h1 className="font-serif text-2xl font-bold">
                {locale === "zh" ? "用户管理" : "User Management"}
              </h1>
            </div>
          </div>
          <div className="flex gap-6 mt-6 text-sm text-forest-100">
            <span><span className="font-bold text-white text-lg">{users.length}</span> {locale === "zh" ? " 位用户" : " users"}</span>
            <span><span className="font-bold text-white text-lg">{adminCount}</span> {locale === "zh" ? " 位管理员" : " admins"}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={locale === "zh" ? "搜索用户名或邮箱…" : "Search by name or email…"}
            className="input pl-11"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-24">
            <span className="w-8 h-8 border-2 border-forest-200 border-t-forest-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-card">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-gray-50 border-b border-cream-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>{locale === "zh" ? "用户" : "User"}</span>
              <span className="text-center">{locale === "zh" ? "内容" : "Activity"}</span>
              <span className="text-center">{locale === "zh" ? "权限" : "Role"}</span>
              <span className="text-center">{locale === "zh" ? "操作" : "Actions"}</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <FiUsers className="mx-auto text-4xl mb-3 text-gray-300" />
                <p>{locale === "zh" ? "没有找到用户" : "No users found"}</p>
              </div>
            ) : (
              <div className="divide-y divide-cream-100">
                {filtered.map((user, i) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-cream-50 transition-colors ${user.id === currentUserId ? "bg-brand-50/30" : ""}`}
                  >
                    {/* User info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {user.name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-forest-900 text-sm truncate">{user.name}</p>
                            {user.id === currentUserId && (
                              <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                                {locale === "zh" ? "你" : "You"}
                              </span>
                            )}
                            {user.isAdmin && (
                              <span className="text-[10px] bg-forest-100 text-forest-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          <p className="text-[10px] text-gray-300 mt-0.5">
                            {locale === "zh" ? "注册于 " : "Joined "}
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Activity */}
                    <div className="flex flex-col items-center gap-1 text-xs text-gray-400 w-16">
                      <span className="flex items-center gap-1">
                        <FiMessageSquare className="text-[10px]" />{user._count.posts}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiBook className="text-[10px]" />{user._count.readingList}
                      </span>
                    </div>

                    {/* Toggle admin */}
                    <div className="flex justify-center w-10">
                      {user.id !== currentUserId && (
                        <button
                          onClick={() => toggleAdmin(user)}
                          disabled={actionLoading === user.id}
                          title={user.isAdmin
                            ? (locale === "zh" ? "撤销管理员" : "Revoke admin")
                            : (locale === "zh" ? "设为管理员" : "Grant admin")}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.isAdmin
                              ? "text-forest-600 hover:bg-forest-50"
                              : "text-gray-300 hover:bg-gray-100 hover:text-forest-400"
                          } disabled:opacity-40`}
                        >
                          {actionLoading === user.id
                            ? <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin block" />
                            : user.isAdmin ? <FiShield /> : <FiShieldOff />}
                        </button>
                      )}
                    </div>

                    {/* Delete */}
                    <div className="flex justify-center w-10">
                      {user.id !== currentUserId && (
                        <button
                          onClick={() => setDeleteTarget(user)}
                          disabled={actionLoading === user.id}
                          title={locale === "zh" ? "删除用户" : "Delete user"}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center"
            >
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FiAlertTriangle className="text-2xl text-red-500" />
              </div>
              <h3 className="font-serif text-xl font-bold text-forest-900 mb-2">
                {locale === "zh" ? "确认删除用户？" : "Delete this user?"}
              </h3>
              <p className="text-sm text-gray-500 mb-1">
                <span className="font-semibold text-gray-700">{deleteTarget.name}</span>
              </p>
              <p className="text-sm text-gray-400 mb-7">
                {locale === "zh"
                  ? "此操作将永久删除该用户及其所有数据，无法恢复。"
                  : "This permanently deletes the user and all their data. This cannot be undone."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 border border-cream-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  {locale === "zh" ? "取消" : "Cancel"}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading === deleteTarget.id}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {actionLoading === deleteTarget.id
                    ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <FiTrash2 />}
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
