"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft, FiUsers, FiStar, FiHeart,
  FiMessageSquare, FiShare2, FiCheck, FiX, FiCopy, FiTwitter,
  FiBookOpen,
} from "react-icons/fi";
import { SiWhatsapp, SiX, SiFacebook, SiWechat, SiTiktok } from "react-icons/si";
import { formatDistanceToNow } from "@/lib/utils";
import { BookCover } from "@/components/BookCover";
import { Avatar } from "@/components/Navbar";
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
  fileUrl: string | null;
  fileType: string | null;
  readLink: string | null;
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

type ReadStatus = "want_to_read" | "reading" | "finished" | null;


const TYPE_CONFIG: Record<string, { labelZh: string; labelEn: string; pill: string; emoji: string }> = {
  review:   { labelZh: "书评", labelEn: "Review",   pill: "bg-purple-50 text-purple-700 border-purple-100", emoji: "⭐" },
  progress: { labelZh: "进度", labelEn: "Progress", pill: "bg-emerald-50 text-emerald-700 border-emerald-100", emoji: "📊" },
  quote:    { labelZh: "摘录", labelEn: "Quote",    pill: "bg-amber-50 text-amber-700 border-amber-100", emoji: "💡" },
  share:    { labelZh: "分享", labelEn: "Share",    pill: "bg-sky-50 text-sky-700 border-sky-100", emoji: "💬" },
};

const SITE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || "";

/* ── Social Share Tray ── */
function SocialShareTray({
  bookId, title, author, locale, onClose,
}: {
  bookId: string; title: string; author: string; locale: string; onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [douyinCopied, setDouyinCopied] = useState(false);
  const [showWechatQr, setShowWechatQr] = useState(false);
  const pageUrl = `${SITE_URL}/books/${bookId}`;
  const shareText =
    locale === "zh"
      ? `我在「我们真的爱读书」发现了《${title}》by ${author}，快来看看！`
      : `Check out "${title}" by ${author} on 我们真的爱读书!`;
  const douyinText =
    locale === "zh"
      ? `📚 ${shareText}\n\n#读书 #${title} #我们真的爱读书\n\n${pageUrl}`
      : `📚 ${shareText}\n\n#reading #books #${title}\n\n${pageUrl}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const copyDouyin = async () => {
    try {
      await navigator.clipboard.writeText(douyinText);
      setDouyinCopied(true);
      setTimeout(() => setDouyinCopied(false), 2500);
    } catch {}
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(pageUrl)}`;

  const PLATFORMS = [
    {
      key: "x",
      label: "X / Twitter",
      icon: <SiX />,
      color: "hover:bg-black hover:text-white hover:border-black",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`,
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: <SiFacebook />,
      color: "hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: <SiWhatsapp />,
      color: "hover:bg-[#25D366] hover:text-white hover:border-[#25D366]",
      href: `https://wa.me/?text=${encodeURIComponent(shareText + " " + pageUrl)}`,
    },
    {
      key: "weibo",
      label: locale === "zh" ? "微博" : "Weibo",
      icon: <span className="text-xs font-bold leading-none">微博</span>,
      color: "hover:bg-[#E6162D] hover:text-white hover:border-[#E6162D]",
      href: `https://service.weibo.com/share/share.php?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(shareText)}`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className="bg-white border border-cream-200 rounded-2xl p-4 shadow-card"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {locale === "zh" ? "分享到" : "Share to"}
        </p>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors text-sm">
          <FiX />
        </button>
      </div>

      {/* Platform buttons */}
      <div className="flex flex-wrap gap-2 mb-3">
        {PLATFORMS.map(({ key, label, icon, color, href }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3 py-2 border border-cream-200 rounded-xl text-sm text-gray-600 transition-all ${color}`}
          >
            <span className="text-base leading-none">{icon}</span>
            <span className="text-xs font-medium">{label}</span>
          </a>
        ))}

        {/* WeChat — QR code popover */}
        <div className="relative">
          <button
            onClick={() => setShowWechatQr(v => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm transition-all ${
              showWechatQr
                ? "bg-[#07C160] text-white border-[#07C160]"
                : "border-cream-200 text-gray-600 hover:bg-[#07C160] hover:text-white hover:border-[#07C160]"
            }`}
          >
            <SiWechat className="text-base" />
            <span className="text-xs font-medium">{locale === "zh" ? "微信" : "WeChat"}</span>
          </button>
          <AnimatePresence>
            {showWechatQr && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 bg-white rounded-2xl shadow-card-hover border border-cream-200 p-3 w-52 text-center"
              >
                <p className="text-xs text-gray-500 mb-2">
                  {locale === "zh" ? "微信扫一扫分享" : "Scan with WeChat"}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="WeChat QR"
                  width={180}
                  height={180}
                  className="rounded-xl mx-auto"
                />
                <p className="text-[10px] text-gray-400 mt-2 break-all">{pageUrl}</p>
                {/* Arrow */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-cream-200 rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Douyin — copy text with hashtags */}
        <button
          onClick={copyDouyin}
          className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm transition-all ${
            douyinCopied
              ? "bg-black text-white border-black"
              : "border-cream-200 text-gray-600 hover:bg-black hover:text-white hover:border-black"
          }`}
          title={locale === "zh" ? "复制文字，粘贴到抖音发布" : "Copy text to post on Douyin"}
        >
          <SiTiktok className="text-base" />
          <span className="text-xs font-medium">
            {douyinCopied
              ? (locale === "zh" ? "已复制！" : "Copied!")
              : (locale === "zh" ? "抖音" : "Douyin")}
          </span>
        </button>
      </div>

      {douyinCopied && (
        <p className="text-xs text-gray-400 mb-2 bg-gray-50 rounded-xl px-3 py-2 border border-cream-100">
          {locale === "zh"
            ? "📋 已复制文字和话题标签，打开抖音粘贴发布吧！"
            : "📋 Text & hashtags copied — paste into Douyin to post!"}
        </p>
      )}

      {/* Copy link */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-cream-100">
        <span className="text-xs text-gray-400 truncate flex-1">{pageUrl}</span>
        <button
          onClick={copy}
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0 ${
            copied
              ? "bg-forest-100 text-forest-700"
              : "bg-white border border-cream-200 text-gray-600 hover:border-brand-200 hover:text-brand-600"
          }`}
        >
          {copied ? <FiCheck className="text-xs" /> : <FiCopy className="text-xs" />}
          {copied
            ? (locale === "zh" ? "已复制" : "Copied!")
            : (locale === "zh" ? "复制链接" : "Copy")}
        </button>
      </div>
    </motion.div>
  );
}

/* ── Read Button (login-gated, prominent) ── */
function ReadButton({
  book, session, locale, router,
}: {
  book: Book;
  session: ReturnType<typeof useSession>["data"];
  locale: string;
  router: ReturnType<typeof useRouter>;
}) {
  const label = locale === "zh"
    ? (book.fileUrl ? "开始阅读" : book.readLink?.includes("amazon") ? "Kindle 阅读" : "在线阅读")
    : (book.fileUrl ? "Start Reading" : book.readLink?.includes("amazon") ? "Read on Kindle" : "Read Online");

  const btnClass =
    "w-full flex items-center justify-center gap-2.5 px-6 py-4 " +
    "bg-gradient-to-r from-forest-700 to-forest-500 hover:from-forest-800 hover:to-forest-600 " +
    "text-white rounded-2xl text-base font-bold tracking-wide " +
    "shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98]";

  if (!session) {
    return (
      <button
        onClick={() => {
          toast.error(locale === "zh" ? "请先登录后才能阅读" : "Please log in to read");
          router.push(`/login?callbackUrl=/books/${book.id}/read`);
        }}
        className={btnClass}
      >
        <FiBookOpen className="text-lg flex-shrink-0" />
        {label}
      </button>
    );
  }

  if (book.fileUrl) {
    return (
      <Link href={`/books/${book.id}/read`} className={btnClass}>
        <FiBookOpen className="text-lg flex-shrink-0" />
        {label}
      </Link>
    );
  }

  return (
    <a
      href={book.readLink!}
      target="_blank"
      rel="noopener noreferrer"
      className={btnClass}
    >
      <FiBookOpen className="text-lg flex-shrink-0" />
      {label}
    </a>
  );
}

export function BookDetailClient({ book }: { book: Book }) {
  const { locale, t } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();
  const [showShareTray, setShowShareTray] = useState(false);

  const [myStatus, setMyStatus]     = useState<ReadStatus>(null);
  // Track exactly which status is being sent (null = no request in flight)
  const [pendingStatus, setPending] = useState<ReadStatus | "remove" | null>(null);
  const [statusFetched, setSF]      = useState(false);
  const [statusCounts, setStatusCounts] = useState({
    want_to_read: book.userBooks.filter(u => u.status === "want_to_read").length,
    reading:      book.userBooks.filter(u => u.status === "reading").length,
    finished:     book.userBooks.filter(u => u.status === "finished").length,
  });

  const displayTitle  = locale === "zh" ? (book.titleZh  || book.title)  : book.title;
  const displayAuthor = locale === "zh" ? (book.authorZh || book.author) : book.author;
  const displayDesc   = locale === "zh" ? (book.descriptionZh || book.description) : book.description;

  const ratings   = book.userBooks.filter(ub => ub.rating).map(ub => ub.rating!);
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;

  /* Fetch current user's status */
  useEffect(() => {
    if (!session?.user?.id) { setSF(true); return; }
    fetch(`/api/userbook/${book.id}`)
      .then(r => r.json())
      .then(d => { setMyStatus(d.status ?? null); setSF(true); })
      .catch(() => setSF(true));
  }, [session, book.id]);

  const handleStatus = async (newStatus: ReadStatus) => {
    if (!session) {
      toast.error(locale === "zh" ? "请先登录" : "Please log in first");
      router.push("/login");
      return;
    }
    if (pendingStatus !== null) return; // a request is already in flight

    // Toggle off if clicking the active status, otherwise switch
    const target = newStatus === myStatus ? null : newStatus;
    const pendingKey = target === null ? "remove" : target;
    setPending(pendingKey);
    const prev = myStatus;
    setMyStatus(target);          // optimistic

    // Optimistically update counts
    setStatusCounts(c => {
      const next = { ...c };
      if (prev) next[prev] = Math.max(0, next[prev] - 1);
      if (target) next[target] = next[target] + 1;
      return next;
    });

    try {
      if (target === null) {
        await fetch(`/api/userbook/${book.id}`, { method: "DELETE" });
        toast.success(locale === "zh" ? "已从书单移除" : "Removed from your list");
      } else {
        await fetch(`/api/userbook/${book.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: target }),
        });
        const labels: Record<string, [string, string]> = {
          want_to_read: ["已加入想读列表 📌", "Added to Want to Read 📌"],
          reading:      ["开始阅读 📖", "Started Reading 📖"],
          finished:     ["标记为已读 ✅", "Marked as Finished ✅"],
        };
        const [zh, en] = labels[target];
        toast.success(locale === "zh" ? zh : en);
      }
    } catch {
      // Revert on error
      setMyStatus(prev);
      setStatusCounts(c => {
        const next = { ...c };
        if (target) next[target] = Math.max(0, next[target] - 1);
        if (prev) next[prev] = next[prev] + 1;
        return next;
      });
      toast.error(locale === "zh" ? "操作失败，请重试" : "Failed, please try again");
    } finally {
      setPending(null);
    }
  };

  const STATUS_BTNS = [
    { key: "want_to_read" as const, emoji: "📌", labelZh: "想读", labelEn: "Want to Read",
      active: "bg-sky-500 text-white border-sky-500 shadow-md",
      idle:   "bg-white text-sky-600 border-sky-200 hover:bg-sky-50 hover:border-sky-300" },
    { key: "reading"      as const, emoji: "📖", labelZh: "在读", labelEn: "Reading",
      active: "bg-brand-500 text-white border-brand-500 shadow-md",
      idle:   "bg-white text-brand-600 border-brand-200 hover:bg-brand-50 hover:border-brand-300" },
    { key: "finished"     as const, emoji: "✅", labelZh: "读完", labelEn: "Finished",
      active: "bg-forest-600 text-white border-forest-600 shadow-md",
      idle:   "bg-white text-forest-700 border-forest-200 hover:bg-forest-50 hover:border-forest-300" },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/books"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-forest-700 transition-colors mb-6 text-sm font-medium">
          <FiArrowLeft />
          {t.common.back}
        </Link>

        {/* Book Info Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-cream-200 shadow-card overflow-hidden mb-6">
          {/* Header band */}
          <div className="h-28 bg-gradient-to-br from-forest-600 to-forest-400 relative overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="absolute text-4xl opacity-10 select-none"
                style={{ left: `${i * 22 + 5}%`, top: `${(i % 2) * 30 + 10}%`, transform: `rotate(${i * 15}deg)` }}>
                📚
              </div>
            ))}
          </div>

          <div className="px-6 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row gap-6 -mt-14">
              {/* Cover */}
              <div className="w-24 sm:w-32 flex-shrink-0">
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-xl border-4 border-white book-shadow">
                  <BookCover src={book.cover} alt={displayTitle} title={displayTitle} />
                </div>
              </div>

              {/* Info */}
              <div className="sm:pt-16 flex-1 min-w-0">
                {book.genre && (
                  <span className="inline-block px-3 py-1 bg-forest-50 text-forest-700 rounded-full text-xs font-semibold mb-2 border border-forest-100">
                    {book.genre}
                  </span>
                )}
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mb-1 leading-tight">
                  {displayTitle}
                </h1>
                <p className="text-base text-gray-500 mb-3">{displayAuthor}</p>

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  {avgRating && (
                    <span className="flex items-center gap-1 text-amber-500 font-semibold">
                      <FiStar className="fill-amber-400" />
                      {avgRating}
                      <span className="text-gray-400 font-normal text-xs">({ratings.length})</span>
                    </span>
                  )}
                  {book.publishYear && <span className="text-gray-400 text-xs">📅 {book.publishYear}</span>}
                  <span className="flex items-center gap-1 text-xs">
                    <FiUsers className="text-forest-400" />
                    {book._count.userBooks} {locale === "zh" ? "人在读" : "readers"}
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <FiMessageSquare className="text-brand-400" />
                    {book._count.posts} {locale === "zh" ? "条分享" : "shares"}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {displayDesc && (
              <p className="mt-5 text-gray-600 text-sm leading-relaxed bg-cream-50 rounded-2xl p-4 border border-cream-100">
                {displayDesc}
              </p>
            )}

            {/* ── Actions ── */}
            <div className="mt-6 space-y-4">

              {/* 1. Read button — most prominent, full-width */}
              {(book.fileUrl || book.readLink) && (
                <ReadButton book={book} session={session} locale={locale} router={router} />
              )}

              {/* 2. Reading status — segmented control */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {locale === "zh" ? "阅读状态" : "Reading Status"}
                </p>
                <div className="flex rounded-2xl border border-cream-200 overflow-hidden bg-gray-50">
                  {STATUS_BTNS.map(({ key, emoji, labelZh, labelEn }, idx) => {
                    const isActive = myStatus === key;
                    const isThisLoading = pendingStatus === key ||
                      (pendingStatus === "remove" && isActive);
                    const isAnyLoading = pendingStatus !== null;

                    const activeColors = [
                      "bg-sky-500 text-white",
                      "bg-brand-500 text-white",
                      "bg-forest-600 text-white",
                    ];

                    return (
                      <button
                        key={key}
                        onClick={() => handleStatus(isActive ? null : key)}
                        disabled={isAnyLoading || !statusFetched}
                        className={[
                          "flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-all duration-200",
                          "disabled:cursor-not-allowed",
                          idx > 0 ? "border-l border-cream-200" : "",
                          isActive
                            ? activeColors[idx]
                            : "text-gray-500 hover:bg-white hover:text-gray-800",
                          isAnyLoading && !isThisLoading ? "opacity-40" : "",
                        ].join(" ")}
                      >
                        {isThisLoading
                          ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          : <span className="text-base leading-none">{emoji}</span>}
                        <span>{locale === "zh" ? labelZh : labelEn}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Hint to tap again to deselect */}
                {myStatus && (
                  <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                    {locale === "zh" ? "再次点击可取消" : "Tap again to remove"}
                  </p>
                )}
              </div>

              {/* 3. Reader counts — compact row */}
              <div className="grid grid-cols-3 gap-2">
                {STATUS_BTNS.map(({ key, emoji, labelZh, labelEn }) => (
                  <div key={key} className="flex flex-col items-center py-2.5 bg-gray-50 rounded-xl border border-cream-100">
                    <span className="text-lg leading-none mb-1">{emoji}</span>
                    <span className="text-lg font-bold text-forest-800 leading-none">{statusCounts[key]}</span>
                    <span className="text-[9px] text-gray-400 mt-0.5">{locale === "zh" ? labelZh : labelEn}</span>
                  </div>
                ))}
              </div>

              {/* 4. Share section */}
              <div className="flex items-center gap-2 flex-wrap">
                {session ? (
                  <Link href={`/share?book=${book.id}`}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-brand">
                    <FiShare2 />
                    {t.books.share_book}
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      toast.error(locale === "zh" ? "请先登录后再分享" : "Please log in to share");
                      router.push(`/login?callbackUrl=/share?book=${book.id}`);
                    }}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-brand">
                    <FiShare2 />
                    {t.books.share_book}
                  </button>
                )}
                <button
                  onClick={() => setShowShareTray(v => !v)}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-cream-200 hover:border-brand-200 hover:bg-brand-50/40 text-gray-500 hover:text-brand-600 rounded-xl text-sm font-medium transition-all">
                  <FiShare2 className="text-sm" />
                  <span className="hidden sm:inline">{locale === "zh" ? "社交分享" : "Social"}</span>
                </button>
              </div>

              {/* Social share tray */}
              <AnimatePresence>
                {showShareTray && (
                  <SocialShareTray
                    bookId={book.id}
                    title={displayTitle}
                    author={displayAuthor}
                    locale={locale}
                    onClose={() => setShowShareTray(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Posts feed */}
        <div>
          <h2 className="font-serif text-xl font-bold text-forest-900 flex items-center gap-2 mb-5">
            <FiMessageSquare className="text-brand-400" />
            {t.home.recent_shares}
          </h2>

          {book.posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center shadow-card">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-gray-500 mb-4 text-sm">
                {locale === "zh" ? "还没有分享，来第一个分享吧！" : "No shares yet. Be the first!"}
              </p>
              <Link href={`/share?book=${book.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors">
                <FiShare2 />
                {t.books.share_book}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {book.posts.map((post, i) => {
                const tc = TYPE_CONFIG[post.type] ?? TYPE_CONFIG.share;
                return (
                  <motion.div key={post.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl border border-cream-200 p-5 hover:shadow-card transition-shadow">
                    <div className="flex items-start gap-3">
                      <Avatar name={post.user.name} image={post.user.image} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-forest-900 text-sm">{post.user.name}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tc.pill}`}>
                            {tc.emoji} {locale === "zh" ? tc.labelZh : tc.labelEn}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(post.createdAt), locale)}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <FiHeart /> {post._count.likes}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <FiMessageSquare /> {post._count.comments}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
