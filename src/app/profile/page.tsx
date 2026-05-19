"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/Navbar";
import {
  FiArrowRight, FiMessageSquare, FiEdit2, FiX, FiCheck,
  FiHeart, FiBookOpen, FiChevronLeft, FiChevronRight, FiUser,
  FiCamera, FiCalendar, FiTrendingUp, FiZap,
} from "react-icons/fi";

// ── Types ────────────────────────────────────────────────────────────

interface Stats {
  wantToRead: number;
  reading: number;
  finished: number;
  postCount: number;
}

interface BookSnippet {
  id: string;
  title: string;
  titleZh: string | null;
  cover: string | null;
  author: string;
  authorZh: string | null;
}

interface Post {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  book: BookSnippet | null;
  _count: { likes: number; comments: number };
}

interface PostsData {
  posts: Post[];
  total: number;
  page: number;
  pages: number;
}

interface ReadingLog {
  date: string; // YYYY-MM-DD
  pages: number;
  note: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

const POST_TYPE_LABELS: Record<string, [string, string]> = {
  share:    ["分享", "Share"],
  review:   ["书评", "Review"],
  progress: ["进度", "Progress"],
  quote:    ["摘录", "Quote"],
};

const POST_TYPE_COLORS: Record<string, string> = {
  share:    "bg-brand-50 text-brand-600 border-brand-100",
  review:   "bg-forest-50 text-forest-700 border-forest-100",
  progress: "bg-sky-50 text-sky-600 border-sky-100",
  quote:    "bg-amber-50 text-amber-600 border-amber-100",
};

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

/** UTC today as YYYY-MM-DD */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Number of days in a given year/month (1-indexed) */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 0=Sun..6=Sat for day 1 of year/month */
function firstWeekday(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/** Heat-map colour based on pages */
function heatColor(pages: number | undefined): string {
  if (!pages) return "bg-gray-100";
  if (pages <= 10) return "bg-brand-100";
  if (pages <= 25) return "bg-brand-300";
  if (pages <= 50) return "bg-brand-500";
  return "bg-forest-500";
}

/** Compute streak: consecutive days ending at today with any log */
function calcStreak(logs: Map<string, number>): number {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    // convert to local date string for comparison
    const key = d.toISOString().slice(0, 10);
    if (logs.has(key) && (logs.get(key) ?? 0) > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ── Edit Profile Modal ───────────────────────────────────────────────

function EditProfileModal({
  initialName,
  initialImage,
  onClose,
  onSaved,
}: {
  initialName: string;
  initialImage: string | null | undefined;
  onClose: () => void;
  onSaved: (name: string, image: string | null) => void;
}) {
  const { locale } = useLanguage();
  const [name, setName]       = useState(initialName);
  const [image, setImage]     = useState(initialImage ?? "");
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]     = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewImage = image.trim() || null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic client-side validation
    if (file.size > 2 * 1024 * 1024) {
      setError(locale === "zh" ? "图片不能超过 2MB" : "Image must be under 2 MB");
      return;
    }
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type.toLowerCase())) {
      setError(locale === "zh" ? "仅支持 JPG、PNG、WebP、GIF" : "Only JPG, PNG, WebP, GIF are supported");
      return;
    }

    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Upload failed");
      }
      const { url } = await res.json() as { url: string };
      setImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === "zh" ? "上传失败" : "Upload failed"));
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError(locale === "zh" ? "昵称不能为空" : "Name cannot be empty");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), image: image.trim() || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed");
      }
      const data = await res.json() as { name: string; image: string | null };
      onSaved(data.name, data.image);
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === "zh" ? "保存失败" : "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-lg font-bold text-forest-900">
            {locale === "zh" ? "编辑个人资料" : "Edit Profile"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <FiX size={16} />
          </button>
        </div>

        {/* Clickable avatar */}
        <div className="flex flex-col items-center mb-6 gap-2">
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={uploading}
            className="relative group focus:outline-none"
            title={locale === "zh" ? "点击更换头像" : "Click to change avatar"}
          >
            <Avatar name={name} image={previewImage} size={80} />
            {/* Overlay */}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 group-disabled:opacity-100 transition-opacity flex items-center justify-center">
              {uploading ? (
                <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <FiCamera className="text-white" size={18} />
              )}
            </div>
          </button>
          <p className="text-xs text-gray-400">
            {uploading
              ? (locale === "zh" ? "上传中…" : "Uploading…")
              : (locale === "zh" ? "点击头像更换图片" : "Click avatar to upload")}
          </p>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              {locale === "zh" ? "昵称" : "Display Name"}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={50}
              className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm text-gray-700 transition-shadow"
            />
          </div>

          {/* Avatar URL (secondary) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              {locale === "zh" ? "或填写头像链接" : "Or paste avatar URL"}
            </label>
            <input
              type="url"
              value={image}
              onChange={e => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm text-gray-700 placeholder-gray-300 transition-shadow"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              {locale === "zh" ? "留空则使用默认字母头像" : "Leave empty to use the default initial avatar"}
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-cream-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {locale === "zh" ? "取消" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading}
              className="flex-1 btn-brand py-2.5 rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {saving
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                : <><FiCheck className="inline mr-1" />{locale === "zh" ? "保存" : "Save"}</>}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Reading Calendar Section ─────────────────────────────────────────

function ReadingCalendarSection({ locale }: { locale: string }) {
  const today = todayStr();
  const [year, setYear]   = useState(() => new Date().getUTCFullYear());
  const [month, setMonth] = useState(() => new Date().getUTCMonth() + 1);
  const [logs, setLogs]   = useState<Map<string, ReadingLog>>(new Map());
  const [loading, setLoading] = useState(true);

  // Check-in form
  const [inputPages, setInputPages] = useState("");
  const [inputNote, setInputNote]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState("");

  const fetchLogs = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reading-log?year=${y}&month=${m}`);
      const data = await res.json() as ReadingLog[];
      const map = new Map<string, ReadingLog>();
      for (const l of data) map.set(l.date, l);
      setLogs(map);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(year, month); }, [fetchLogs, year, month]);

  // Pre-fill today's log if it exists
  useEffect(() => {
    const existing = logs.get(today);
    if (existing) {
      setInputPages(String(existing.pages));
      setInputNote(existing.note ?? "");
    } else {
      setInputPages("");
      setInputNote("");
    }
  }, [logs, today]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const isCurrentMonth =
    year === new Date().getUTCFullYear() && month === new Date().getUTCMonth() + 1;

  const handleCheckin = async () => {
    const pages = parseInt(inputPages, 10);
    if (!Number.isInteger(pages) || pages < 1 || pages > 9999) {
      setSaveMsg(locale === "zh" ? "请输入 1-9999 的数字" : "Enter a number between 1 and 9999");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/reading-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages, note: inputNote.trim() || null, date: today }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Failed");
      }
      const log = await res.json() as ReadingLog;
      setLogs(prev => new Map(prev).set(log.date, log));
      setSaveMsg(locale === "zh" ? "✅ 已打卡！" : "✅ Logged!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : (locale === "zh" ? "保存失败" : "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  // Calendar grid
  const totalDays = daysInMonth(year, month);
  const startWd   = firstWeekday(year, month); // 0=Sun
  const cells: (number | null)[] = [
    ...Array<null>(startWd).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // Pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null);

  const todayDate = new Date();
  const todayDay  = todayDate.getUTCDate();

  // Stats
  const allLogs = Array.from(logs.values());
  const monthlyPages = allLogs.reduce((s, l) => s + l.pages, 0);
  const daysLogged   = allLogs.filter(l => l.pages > 0).length;

  // Build a full map across all cached months for streak
  const logsForStreak = new Map<string, number>();
  Array.from(logs.entries()).forEach(([k, v]) => logsForStreak.set(k, v.pages));
  const streak = calcStreak(logsForStreak);

  const dayHeaders = locale === "zh"
    ? ["日", "一", "二", "三", "四", "五", "六"]
    : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(
    locale === "zh" ? "zh-CN" : "en-US",
    { year: "numeric", month: "long" }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-cream-100">
        <div className="flex items-center gap-2 mb-1">
          <FiCalendar className="text-brand-500" size={16} />
          <h3 className="font-serif text-base font-bold text-forest-900">
            {locale === "zh" ? "每日打卡" : "Daily Reading Log"}
          </h3>
        </div>
        <p className="text-xs text-gray-400">
          {locale === "zh" ? "记录每天阅读的页数" : "Log how many pages you read each day"}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-cream-100 border-b border-cream-100">
        {[
          { icon: "📄", label: locale === "zh" ? "本月页数" : "Pages this month", value: monthlyPages },
          { icon: "📅", label: locale === "zh" ? "打卡天数" : "Days logged",       value: daysLogged },
          { icon: "🔥", label: locale === "zh" ? "连续天数" : "Day streak",         value: streak },
        ].map(({ icon, label, value }) => (
          <div key={label} className="px-4 py-3 text-center">
            <div className="text-lg mb-0.5">{icon}</div>
            <div className="text-lg font-bold text-forest-800">{value}</div>
            <div className="text-[10px] text-gray-400 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Today's check-in */}
      {isCurrentMonth && (
        <div className="px-5 py-4 bg-brand-50/40 border-b border-cream-100">
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
            {locale === "zh" ? `今天读了多少页？(${today})` : `How many pages today? (${today})`}
          </p>
          <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <input
                type="number"
                min={1}
                max={9999}
                value={inputPages}
                onChange={e => setInputPages(e.target.value)}
                placeholder={locale === "zh" ? "页数" : "Pages"}
                className="w-full px-3 py-2 border border-cream-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white transition-shadow"
              />
              <input
                type="text"
                value={inputNote}
                onChange={e => setInputNote(e.target.value)}
                placeholder={locale === "zh" ? "备注（选填）" : "Note (optional)"}
                maxLength={200}
                className="w-full px-3 py-2 border border-cream-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white transition-shadow"
              />
            </div>
            <button
              onClick={handleCheckin}
              disabled={saving}
              className="btn-brand px-4 py-2 text-sm rounded-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex-shrink-0 h-[38px]"
            >
              {saving
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                : (locale === "zh" ? "打卡" : "Log")}
            </button>
          </div>
          {saveMsg && (
            <p className={`text-sm mt-2 font-medium ${saveMsg.startsWith("✅") ? "text-forest-600" : "text-red-500"}`}>
              {saveMsg}
            </p>
          )}
        </div>
      )}

      {/* Calendar */}
      <div className="px-5 py-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-forest-800">{monthLabel}</span>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FiChevronRight size={16} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {dayHeaders.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-md bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={`e${idx}`} />;

              const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const log     = logs.get(dateKey);
              const isToday = isCurrentMonth && day === todayDay;
              const isFuture = isCurrentMonth && day > todayDay;
              const color   = isFuture ? "bg-gray-50" : heatColor(log?.pages);

              return (
                <div
                  key={day}
                  title={log ? `${log.pages}${locale === "zh" ? "页" : " pages"}${log.note ? ` · ${log.note}` : ""}` : undefined}
                  className={`
                    aspect-square rounded-md flex items-center justify-center text-[10px] font-medium relative
                    ${color}
                    ${isToday ? "ring-2 ring-brand-500 ring-offset-1" : ""}
                    ${isFuture ? "text-gray-300" : log ? "text-white" : "text-gray-400"}
                    ${log && !isFuture ? "cursor-default" : ""}
                  `}
                >
                  {day}
                  {log && log.pages > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-forest-400 rounded-full border border-white" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400">
          <span>{locale === "zh" ? "少" : "Less"}</span>
          {["bg-gray-100", "bg-brand-100", "bg-brand-300", "bg-brand-500", "bg-forest-500"].map(c => (
            <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>{locale === "zh" ? "多" : "More"}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Post Card ────────────────────────────────────────────────────────

function PostCard({ post, locale }: { post: Post; locale: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = post.content.length > 120;
  const displayContent = isLong && !expanded
    ? post.content.slice(0, 120) + "…"
    : post.content;

  const typeLabel = POST_TYPE_LABELS[post.type] ?? ["分享", "Share"];
  const typeColor = POST_TYPE_COLORS[post.type] ?? POST_TYPE_COLORS.share;

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl border border-cream-200 p-4 hover:border-brand-200 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeColor}`}>
          {locale === "zh" ? typeLabel[0] : typeLabel[1]}
        </span>
        <span className="text-[11px] text-gray-400">{formatDate(post.createdAt, locale)}</span>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{displayContent}</p>
      {isLong && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-xs text-brand-500 hover:text-brand-600 font-medium mt-1 transition-colors"
        >
          {expanded ? (locale === "zh" ? "收起" : "Show less") : (locale === "zh" ? "展开" : "Read more")}
        </button>
      )}

      {/* Related book */}
      {post.book && (
        <Link
          href={`/books/${post.book.id}`}
          className="mt-3 flex items-center gap-3 bg-cream-50 hover:bg-cream-100 rounded-xl p-2.5 transition-colors group"
        >
          <div className="w-9 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
            {post.book.cover ? (
              <img src={post.book.cover} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <FiBookOpen size={16} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-forest-900 group-hover:text-brand-600 transition-colors line-clamp-1">
              {locale === "zh" ? (post.book.titleZh || post.book.title) : post.book.title}
            </p>
            <p className="text-[11px] text-gray-400 line-clamp-1">
              {locale === "zh" ? (post.book.authorZh || post.book.author) : post.book.author}
            </p>
          </div>
          <FiArrowRight className="flex-shrink-0 text-gray-300 group-hover:text-brand-400 transition-colors text-xs" />
        </Link>
      )}

      {/* Footer counts */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <FiHeart size={11} />
          {post._count.likes}
        </span>
        <span className="flex items-center gap-1">
          <FiMessageSquare size={11} />
          {post._count.comments}
        </span>
      </div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { locale } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [postsData, setPostsData] = useState<PostsData | null>(null);
  const [postsPage, setPostsPage] = useState(1);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const postsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile/stats")
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setPostsLoading(true);
    fetch(`/api/profile/posts?page=${postsPage}`)
      .then(r => r.json())
      .then((data: PostsData) => { setPostsData(data); setPostsLoading(false); })
      .catch(() => setPostsLoading(false));
  }, [status, postsPage]);

  const handleProfileSaved = async (name: string, image: string | null) => {
    setShowEditModal(false);
    await update();
    router.refresh();
    void name; void image;
  };

  const handlePageChange = (p: number) => {
    setPostsPage(p);
    setTimeout(() => postsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-gradient">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">📚</div>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (!session) return null;

  const statCards = [
    { emoji: "📌", label: locale === "zh" ? "想读" : "Want",      value: stats?.wantToRead },
    { emoji: "📖", label: locale === "zh" ? "在读" : "Reading",   value: stats?.reading },
    { emoji: "✅", label: locale === "zh" ? "已读" : "Done",      value: stats?.finished },
    { emoji: "💬", label: locale === "zh" ? "分享" : "Posts",     value: stats?.postCount },
  ];

  const hasBooks = stats && (stats.wantToRead + stats.reading + stats.finished) > 0;

  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-20">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-forest-700 via-forest-600 to-forest-500 pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          {/* Avatar with edit button */}
          <div className="relative inline-block mb-4">
            <Avatar name={session.user?.name} image={session.user?.image} size={88} />
            <button
              onClick={() => setShowEditModal(true)}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-cream-50 transition-colors"
              title={locale === "zh" ? "编辑资料" : "Edit profile"}
            >
              <FiEdit2 size={13} className="text-forest-600" />
            </button>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">
            {session.user?.name}
          </h1>
          <p className="text-forest-300 text-sm mb-3">{session.user?.email}</p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {session.user?.isAdmin && (
              <Link href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-full transition-colors">
                🛡️ {locale === "zh" ? "管理后台" : "Admin Panel"}
              </Link>
            )}
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-full transition-colors"
            >
              <FiEdit2 size={11} />
              {locale === "zh" ? "编辑资料" : "Edit Profile"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6 space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-3">
          {statCards.map(({ emoji, label, value }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white rounded-2xl border border-cream-200 p-3 sm:p-5 text-center shadow-sm"
            >
              <div className="text-xl sm:text-2xl mb-1">{emoji}</div>
              <div className="text-xl sm:text-3xl font-bold text-forest-800 mb-0.5">
                {value === undefined
                  ? <span className="inline-block w-6 h-5 bg-gray-100 rounded-lg animate-pulse" />
                  : value}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-400 leading-tight">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Reading progress ── */}
        {hasBooks && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
            <h3 className="font-serif text-base font-bold text-forest-900 mb-4">
              {locale === "zh" ? "阅读进度" : "Reading Progress"}
            </h3>
            <div className="space-y-3">
              {[
                { label: locale === "zh" ? "想读" : "Want to Read", value: stats!.wantToRead, color: "bg-sky-400",     emoji: "📌" },
                { label: locale === "zh" ? "在读" : "Reading",       value: stats!.reading,    color: "bg-brand-400",  emoji: "📖" },
                { label: locale === "zh" ? "已读" : "Finished",      value: stats!.finished,   color: "bg-forest-500", emoji: "✅" },
              ].map(({ label, value, color, emoji }) => {
                const total = stats!.wantToRead + stats!.reading + stats!.finished;
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 flex items-center gap-1.5">{emoji} {label}</span>
                      <span className="font-semibold text-forest-800">{value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: 0.4 }}
                        className={`h-full rounded-full ${color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Daily Reading Calendar ── */}
        <ReadingCalendarSection locale={locale} />

        {/* ── Onboarding (no activity yet) ── */}
        {!hasBooks && stats !== null && stats.postCount === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-cream-200 p-8 text-center shadow-sm">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="font-serif text-xl font-bold text-forest-900 mb-2">
              {locale === "zh" ? "开始你的阅读之旅！" : "Start Your Reading Journey!"}
            </h2>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              {locale === "zh"
                ? "浏览书库找到感兴趣的书，标记阅读状态，分享你的感悟"
                : "Browse the library, track your reading, and share insights with fellow readers."}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/books" className="btn-brand text-sm py-2.5 px-5">
                {locale === "zh" ? "浏览书库" : "Browse Books"} <FiArrowRight />
              </Link>
              <Link href="/share" className="btn-outline text-sm py-2.5 px-5">
                <FiMessageSquare />
                {locale === "zh" ? "去分享" : "Share"}
              </Link>
            </div>
          </motion.div>
        )}

        {/* ── Quick links ── */}
        {(hasBooks || (stats && stats.postCount > 0)) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="grid grid-cols-2 gap-3">
            <Link href="/books" className="bg-white rounded-2xl border border-cream-200 p-4 flex items-center gap-3 hover:border-brand-200 group shadow-sm transition-all">
              <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0 group-hover:bg-brand-100 transition-colors">📚</div>
              <div className="min-w-0">
                <p className="font-semibold text-forest-900 text-sm group-hover:text-brand-600 transition-colors truncate">
                  {locale === "zh" ? "浏览书库" : "Browse Books"}
                </p>
                <p className="text-xs text-gray-400 truncate">{locale === "zh" ? "发现更多好书" : "Find more books"}</p>
              </div>
            </Link>
            <Link href="/share" className="bg-white rounded-2xl border border-cream-200 p-4 flex items-center gap-3 hover:border-brand-200 group shadow-sm transition-all">
              <div className="w-9 h-9 bg-forest-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0 group-hover:bg-forest-100 transition-colors">✍️</div>
              <div className="min-w-0">
                <p className="font-semibold text-forest-900 text-sm group-hover:text-brand-600 transition-colors truncate">
                  {locale === "zh" ? "分享感悟" : "Share Insights"}
                </p>
                <p className="text-xs text-gray-400 truncate">{locale === "zh" ? "记录阅读" : "Record reading"}</p>
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── My Posts ── */}
        <div ref={postsRef}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-forest-900">
              {locale === "zh" ? "我的分享" : "My Posts"}
              {postsData && postsData.total > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">({postsData.total})</span>
              )}
            </h2>
            <Link href="/share" className="text-xs text-brand-500 hover:text-brand-600 font-semibold transition-colors flex items-center gap-1">
              {locale === "zh" ? "新分享" : "New post"} <FiArrowRight size={11} />
            </Link>
          </div>

          {postsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-cream-200 p-4 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded w-16 mb-3" />
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : postsData && postsData.posts.length > 0 ? (
            <>
              <div className="space-y-3">
                {postsData.posts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <PostCard post={post} locale={locale} />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {postsData.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => handlePageChange(postsPage - 1)}
                    disabled={postsPage <= 1}
                    className="p-2 rounded-xl border border-cream-200 text-gray-500 hover:bg-cream-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  {Array.from({ length: postsData.pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`w-8 h-8 rounded-xl text-sm font-semibold transition-colors ${
                        p === postsPage
                          ? "bg-forest-600 text-white"
                          : "border border-cream-200 text-gray-500 hover:bg-cream-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(postsPage + 1)}
                    disabled={postsPage >= postsData.pages}
                    className="p-2 rounded-xl border border-cream-200 text-gray-500 hover:bg-cream-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : stats !== null ? (
            <div className="bg-white rounded-2xl border border-cream-200 p-8 text-center shadow-sm">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                {locale === "zh" ? "还没有分享" : "No posts yet"}
              </p>
              <p className="text-gray-400 text-xs mb-4">
                {locale === "zh" ? "去分享你的第一条读书感悟吧" : "Share your first reading insight"}
              </p>
              <Link href="/share" className="btn-brand text-xs py-2 px-4 inline-flex items-center gap-1.5">
                <FiMessageSquare size={12} />
                {locale === "zh" ? "去分享" : "Share now"}
              </Link>
            </div>
          ) : null}
        </div>

      </div>

      {/* ── Edit Profile Modal ── */}
      <AnimatePresence>
        {showEditModal && (
          <EditProfileModal
            initialName={session.user?.name ?? ""}
            initialImage={session.user?.image}
            onClose={() => setShowEditModal(false)}
            onSaved={handleProfileSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
