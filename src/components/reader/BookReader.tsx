"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
  FiMinus, FiPlus, FiSun, FiMoon, FiVolume2, FiVolumeX,
  FiMaximize, FiMinimize, FiBookOpen,
} from "react-icons/fi";
import { TtsPlayer } from "./TtsPlayer";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReaderBook {
  id: string;
  title: string;
  titleZh: string | null;
  author: string;
  authorZh: string | null;
  fileUrl: string | null;
  fileType: string | null;
  readLink: string | null;
}

type Theme = "light" | "sepia" | "dark";

const THEMES: Record<Theme, { bg: string; text: string; border: string; bar: string }> = {
  light: { bg: "bg-white",    text: "text-gray-800",  border: "border-gray-200",  bar: "bg-white/95"     },
  sepia: { bg: "bg-amber-50", text: "text-amber-900", border: "border-amber-200", bar: "bg-amber-50/95"  },
  dark:  { bg: "bg-gray-950", text: "text-gray-100",  border: "border-gray-800",  bar: "bg-gray-950/95"  },
};

const CHARS_PER_PAGE = 2000; // TXT: approximate characters per page

// ─── Helper: split plain text into pages ────────────────────────────────────

function splitIntoPages(text: string): string[] {
  const pages: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + CHARS_PER_PAGE;
    if (end >= text.length) {
      const last = text.slice(start).trim();
      if (last) pages.push(last);
      break;
    }
    // Extend up to 400 chars to hit a paragraph boundary
    const look = text.slice(end, end + 400);
    const nl = look.indexOf("\n");
    if (nl >= 0) end = end + nl + 1;
    const page = text.slice(start, end).trim();
    if (page) pages.push(page);
    start = end;
  }
  return pages;
}

// ─── Shared Pagination Bar ────────────────────────────────────────────────────

function PaginationBar({
  page, total, onChange, locale, theme,
}: {
  page: number; total: number;
  onChange: (p: number) => void;
  locale: string; theme: Theme;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput]     = useState(String(page));
  const tc = THEMES[theme];

  const commit = () => {
    const n = parseInt(input, 10);
    if (!isNaN(n) && n >= 1 && n <= total) onChange(n);
    setEditing(false);
  };

  // keep input in sync when page changes externally
  useEffect(() => { setInput(String(page)); }, [page]);

  const btnCls = `p-2 rounded-xl transition-colors disabled:opacity-25 ${tc.text} hover:bg-black/5`;

  return (
    <div className={`flex items-center justify-center gap-2 mt-8 px-4 py-2.5 rounded-2xl border ${tc.border} ${tc.bar} shadow-sm select-none`}>
      {/* First page */}
      <button onClick={() => onChange(1)} disabled={page <= 1} className={btnCls} title={locale === "zh" ? "第一页" : "First"}>
        <FiChevronsLeft size={16} />
      </button>
      {/* Prev */}
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} className={btnCls} title={locale === "zh" ? "上一页" : "Prev"}>
        <FiChevronLeft size={16} />
      </button>

      {/* Clickable page number — click to jump */}
      {editing ? (
        <input
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          className={`w-20 text-center text-sm border ${tc.border} rounded-lg px-2 py-1 bg-transparent ${tc.text} focus:outline-none`}
        />
      ) : (
        <button
          onClick={() => { setInput(String(page)); setEditing(true); }}
          title={locale === "zh" ? "点击跳页" : "Click to jump"}
          className={`text-sm font-medium ${tc.text} min-w-[96px] text-center rounded-lg px-2 py-1 hover:bg-black/5 transition-colors`}
        >
          {locale === "zh" ? `第 ${page} / ${total} 页` : `${page} / ${total}`}
        </button>
      )}

      {/* Next */}
      <button onClick={() => onChange(page + 1)} disabled={page >= total} className={btnCls} title={locale === "zh" ? "下一页" : "Next"}>
        <FiChevronRight size={16} />
      </button>
      {/* Last page */}
      <button onClick={() => onChange(total)} disabled={page >= total} className={btnCls} title={locale === "zh" ? "最后一页" : "Last"}>
        <FiChevronsRight size={16} />
      </button>
    </div>
  );
}

// ─── PDF Reader ───────────────────────────────────────────────────────────────

function PdfReader({
  url, theme, fontSize, locale, initialPage,
  onPageChange, onTotalPages, onTextExtracted,
}: {
  url: string; theme: Theme; fontSize: number; locale: string; initialPage: number;
  onPageChange: (p: number) => void;
  onTotalPages: (t: number) => void;
  onTextExtracted: (text: string) => void;
}) {
  const [pdfModule, setPdfModule] = useState<{
    Document: React.ComponentType<{
      file: string;
      onLoadSuccess: (pdf: { numPages: number }) => void;
      onLoadError: (err: Error) => void;
      loading: React.ReactNode;
      error: React.ReactNode;
      children: React.ReactNode;
    }>;
    Page: React.ComponentType<{
      pageNumber: number;
      width?: number;
      renderTextLayer?: boolean;
      renderAnnotationLayer?: boolean;
      onGetTextSuccess?: (content: { items: Array<{ str: string }> }) => void;
      className?: string;
    }>;
  } | null>(null);

  const [numPages, setNumPages]   = useState(0);
  const [pageNum, setPageNum]     = useState(initialPage);
  const containerRef              = useRef<HTMLDivElement>(null);
  const [width, setWidth]         = useState(600);
  const tc = THEMES[theme];

  useEffect(() => {
    import("react-pdf").then((mod) => {
      // pdfjs-dist v5 only ships ES-module workers (.mjs).
      // We copy pdf.worker.min.mjs to /public at build time (see next.config.mjs)
      // so it's served locally with the correct Content-Type and no CORS issues.
      mod.pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      setPdfModule({ Document: mod.Document as never, Page: mod.Page as never });
    });
  }, []);

  useEffect(() => {
    const update = () => {
      if (containerRef.current)
        setWidth(Math.min(containerRef.current.clientWidth - 32, 800));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const changePage = useCallback((next: number) => {
    const clamped = Math.max(1, Math.min(numPages, next));
    setPageNum(clamped);
    onPageChange(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [numPages, onPageChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") changePage(pageNum + 1);
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   changePage(pageNum - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changePage, pageNum]);

  if (!pdfModule) return <Spinner tc={tc} locale={locale} />;
  const { Document, Page } = pdfModule;

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => { setNumPages(numPages); onTotalPages(numPages); }}
        onLoadError={(err) => console.error("PDF error:", err)}
        loading={<Spinner tc={tc} locale={locale} />}
        error={<LoadError tc={tc} locale={locale} />}
      >
        <Page
          pageNumber={pageNum}
          width={width}
          renderTextLayer
          renderAnnotationLayer={false}
          onGetTextSuccess={(content) => onTextExtracted(content.items.map(i => i.str).join(" "))}
          className="shadow-2xl rounded-lg overflow-hidden"
        />
      </Document>

      {numPages > 0 && (
        <PaginationBar page={pageNum} total={numPages} onChange={changePage} locale={locale} theme={theme} />
      )}
    </div>
  );
}

// ─── TXT Reader ───────────────────────────────────────────────────────────────

function TxtReader({
  url, theme, fontSize, locale, initialPage,
  onTextExtracted, onPageChange, onTotalPages,
}: {
  url: string; theme: Theme; fontSize: number; locale: string; initialPage: number;
  onTextExtracted: (text: string) => void;
  onPageChange: (p: number) => void;
  onTotalPages: (t: number) => void;
}) {
  const [pages, setPages]   = useState<string[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);
  const tc = THEMES[theme];

  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.text();
      })
      .then(text => {
        const ps = splitIntoPages(text);
        setPages(ps);
        onTotalPages(ps.length);
        const start = Math.max(1, Math.min(initialPage, ps.length));
        setPageNum(start);
        onTextExtracted(text.slice(0, 8000));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const changePage = useCallback((next: number) => {
    const clamped = Math.max(1, Math.min(pages.length, next));
    setPageNum(clamped);
    onPageChange(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pages.length, onPageChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") changePage(pageNum + 1);
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   changePage(pageNum - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changePage, pageNum]);

  if (loading) return <Spinner tc={tc} locale={locale} />;
  if (error)   return <LoadError tc={tc} locale={locale} />;

  const currentText = pages[pageNum - 1] ?? "";

  return (
    <div className="w-full">
      {/* Page content */}
      <div
        className={`max-w-2xl mx-auto leading-loose whitespace-pre-wrap font-sans ${tc.text}`}
        style={{ fontSize, lineHeight: 1.9 }}
      >
        {currentText}
      </div>

      {/* Pagination */}
      {pages.length > 1 && (
        <PaginationBar page={pageNum} total={pages.length} onChange={changePage} locale={locale} theme={theme} />
      )}
    </div>
  );
}

// ─── EPUB Reader ──────────────────────────────────────────────────────────────

interface TocItem {
  id?: string;
  href: string;
  label: string;
  subitems?: TocItem[];
}

function EpubReader({
  url, theme, fontSize, locale, onTextExtracted,
}: {
  url: string; theme: Theme; fontSize: number; locale: string;
  onTextExtracted: (text: string) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [EpubView, setEpubView]       = useState<React.ComponentType<any> | null>(null);
  const [location, setLocation]       = useState<string | number>(0);
  const [toc, setToc]                 = useState<TocItem[]>([]);
  const [showToc, setShowToc]         = useState(false);
  const [chapterLabel, setChapterLabel] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renditionRef = useRef<any>(null);
  const tc = THEMES[theme];

  useEffect(() => {
    import("react-reader").then(mod => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEpubView(() => (mod as any).EpubView);
    });
  }, []);

  // Re-apply theme/font whenever they change
  useEffect(() => {
    applyTheme(renditionRef.current, theme, fontSize);
  }, [theme, fontSize]);

  // Keyboard: left/up = prev chapter, right/down = next chapter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") renditionRef.current?.next();
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   renditionRef.current?.prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleGetRendition = useCallback((rendition: any) => {
    renditionRef.current = rendition;
    applyTheme(rendition, theme, fontSize);

    // Extract first page text for TTS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rendition.hooks.content.register((contents: any) => {
      const bodyText = contents.document?.body?.innerText ?? "";
      if (bodyText) onTextExtracted(bodyText.slice(0, 8000));
    });

    // Track chapter label from location changes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rendition.on("locationChanged", (loc: any) => {
      if (!loc?.start?.href) return;
      // walk flattened toc to find matching entry
      const flat = flattenToc(renditionRef.current?.book?.navigation?.toc ?? []);
      const match = flat.find(
        (t) => loc.start.href.endsWith(t.href.split("#")[0])
      );
      if (match) setChapterLabel(match.label.trim());
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateTo = useCallback((href: string, label: string) => {
    setLocation(href);
    setChapterLabel(label.trim());
    setShowToc(false);
  }, []);

  /** Flatten nested TOC items */
  const renderTocItems = (items: TocItem[], depth = 0): React.ReactNode =>
    items.map((item) => (
      <div key={item.href + item.label}>
        <button
          onClick={() => navigateTo(item.href, item.label)}
          className={`w-full text-left py-2 px-3 text-sm rounded-lg transition-colors hover:bg-gray-100 active:bg-gray-200 ${
            depth > 0 ? "text-gray-500" : "text-gray-800 font-medium"
          }`}
          style={{ paddingLeft: `${0.75 + depth * 1}rem` }}
        >
          {item.label.trim()}
        </button>
        {item.subitems && item.subitems.length > 0 && renderTocItems(item.subitems, depth + 1)}
      </div>
    ));

  const bg = theme === "dark" ? "#030712" : theme === "sepia" ? "#fffbeb" : "#ffffff";

  // Bottom nav bar colours
  const barBg     = theme === "dark" ? "bg-gray-900 border-gray-700"
                  : theme === "sepia" ? "bg-amber-50 border-amber-200"
                  : "bg-white border-gray-200";
  const barBtn    = `flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tc.text}
                     hover:bg-black/5 active:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed`;

  if (!EpubView) return <Spinner tc={tc} locale={locale} />;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 160px)", minHeight: "460px" }}>

      {/* ── TOC toggle button (floats top-left over iframe) ── */}
      <div className="relative flex-1 min-h-0">

        <button
          onClick={() => setShowToc(v => !v)}
          title={locale === "zh" ? "目录" : "Table of Contents"}
          className={`absolute top-2 left-2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs
                      font-semibold shadow-sm border transition-colors max-w-[60%] truncate ${
            showToc
              ? "bg-forest-600 text-white border-forest-600"
              : "bg-white/90 text-gray-700 border-gray-200 hover:bg-white"
          }`}
        >
          <FiBookOpen size={13} className="flex-shrink-0" />
          <span className="truncate">{chapterLabel || (locale === "zh" ? "目录" : "Contents")}</span>
        </button>

        {/* TOC drawer */}
        {showToc && (
          <>
            <div className="absolute inset-0 z-20 bg-black/20" onClick={() => setShowToc(false)} />
            <div className="absolute top-0 left-0 bottom-0 z-30 w-72 bg-white shadow-2xl overflow-y-auto flex flex-col">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <span className="font-semibold text-gray-900 text-sm">
                  {locale === "zh" ? "目录" : "Contents"}
                </span>
                <button onClick={() => setShowToc(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">✕</button>
              </div>
              <div className="flex-1 px-2 py-2">
                {toc.length > 0
                  ? renderTocItems(toc)
                  : <p className="text-center text-gray-400 text-sm py-8">
                      {locale === "zh" ? "暂无目录" : "No contents"}
                    </p>
                }
              </div>
            </div>
          </>
        )}

        {/* ── EPUB viewer — scrolled flow so full chapter text is visible ── */}
        <div style={{ position: "absolute", inset: 0, background: bg }}>
          <EpubView
            url={url}
            location={location}
            locationChanged={(loc: string) => setLocation(loc)}
            tocChanged={(t: TocItem[]) => setToc(t)}
            getRendition={handleGetRendition}
            epubOptions={{ flow: "scrolled", manager: "continuous" }}
            loadingView={<Spinner tc={tc} locale={locale} />}
          />
        </div>
      </div>

      {/* ── Chapter navigation bar (always visible) ── */}
      <div className={`flex-shrink-0 flex items-center justify-between border-t px-3 py-2 ${barBg}`}>
        <button
          className={barBtn}
          onClick={() => renditionRef.current?.prev()}
          title={locale === "zh" ? "上一章 (←)" : "Prev chapter (←)"}
        >
          <FiChevronLeft size={16} />
          <span>{locale === "zh" ? "上一章" : "Prev"}</span>
        </button>

        <span className={`text-xs ${tc.text} opacity-50 px-2 truncate max-w-[50%] text-center`}>
          {chapterLabel || (locale === "zh" ? "滚动阅读全文" : "Scroll to read")}
        </span>

        <button
          className={barBtn}
          onClick={() => renditionRef.current?.next()}
          title={locale === "zh" ? "下一章 (→)" : "Next chapter (→)"}
        >
          <span>{locale === "zh" ? "下一章" : "Next"}</span>
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/** Apply theme + font to an epub.js rendition */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyTheme(rendition: any, theme: Theme, fontSize: number) {
  if (!rendition) return;
  rendition.themes.default({
    "html, body": {
      color:      theme === "dark" ? "#f3f4f6" : theme === "sepia" ? "#451a03" : "#1f2937",
      background: theme === "dark" ? "#030712" : theme === "sepia" ? "#fffbeb" : "#ffffff",
      fontSize:   `${fontSize}px`,
      lineHeight: "1.9",
      padding:    "1rem 2rem 3rem",
      margin:     "0",
      maxWidth:   "100%",
    },
    "p, li, div": {
      maxWidth: "100%",
      wordBreak: "break-word",
    },
  });
}

/** Flatten nested TOC tree into a flat array */
function flattenToc(items: TocItem[]): TocItem[] {
  const result: TocItem[] = [];
  for (const item of items) {
    result.push(item);
    if (item.subitems?.length) result.push(...flattenToc(item.subitems));
  }
  return result;
}

// ─── External Link View ───────────────────────────────────────────────────────

function ExternalReader({ url, title, locale }: { url: string; title: string; locale: string }) {
  const isKindle = url.includes("amazon") || url.includes("kindle");
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-6 px-4">
      <div className="text-6xl">{isKindle ? "📱" : "🔗"}</div>
      <div>
        <h3 className="font-serif text-xl font-bold text-forest-900 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">
          {locale === "zh"
            ? (isKindle ? "此书可在 Kindle 上阅读，点击前往" : "此书在外部网站上阅读，点击打开")
            : (isKindle ? "Available on Kindle. Click to read." : "Hosted externally. Click to open.")}
        </p>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold text-sm transition-all hover:shadow-brand">
          <FiBookOpen />
          {locale === "zh" ? (isKindle ? "在 Kindle 阅读" : "打开阅读") : (isKindle ? "Open in Kindle" : "Open to Read")}
        </a>
      </div>
    </div>
  );
}

// ─── Shared micro-components ──────────────────────────────────────────────────

function Spinner({ tc, locale }: { tc: { text: string }; locale: string }) {
  return (
    <div className="flex items-center justify-center h-64 gap-3">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <span className={`text-sm ${tc.text}`}>{locale === "zh" ? "正在加载…" : "Loading…"}</span>
    </div>
  );
}

function LoadError({ tc, locale }: { tc: { text: string }; locale: string }) {
  return (
    <div className={`text-center py-16 ${tc.text}`}>
      <div className="text-4xl mb-3">😞</div>
      <p>{locale === "zh" ? "文件加载失败" : "Failed to load file"}</p>
    </div>
  );
}

// ─── Main BookReader ──────────────────────────────────────────────────────────

export function BookReader({ book, locale, initialPage }: {
  book: ReaderBook;
  locale: string;
  initialPage?: number;
}) {
  const { data: session }     = useSession();
  const [theme, setTheme]     = useState<Theme>("light");
  const [fontSize, setFontSize] = useState(16);
  const [showTts, setShowTts] = useState(false);
  const [ttsText, setTtsText] = useState("");
  const [currentPage, setCurrentPage] = useState(initialPage ?? 1);
  const [totalPages, setTotalPages]   = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const tc = THEMES[theme];

  const displayTitle = locale === "zh" ? (book.titleZh || book.title) : book.title;

  const saveProgress = useCallback((page: number) => {
    if (!session?.user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/userbook/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: page }),
      }).catch(() => {});
    }, 2000);
  }, [session, book.id]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    saveProgress(page);
  }, [saveProgress]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const cycleTheme = () =>
    setTheme(t => t === "light" ? "sepia" : t === "sepia" ? "dark" : "light");

  const themeIcon  = theme === "dark" ? <FiMoon size={16} /> : <FiSun size={16} />;
  const themeLabel = theme === "light" ? (locale === "zh" ? "护眼" : "Sepia")
                   : theme === "sepia" ? (locale === "zh" ? "夜间" : "Dark")
                   : (locale === "zh" ? "日间" : "Light");

  const canRead = !!book.fileUrl || !!book.readLink;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${tc.bg}`}>
      {/* ── Top toolbar ── */}
      <div className={`sticky top-0 z-40 ${tc.bar} backdrop-blur-md border-b ${tc.border} px-4 h-14 flex items-center gap-3`}>
        <Link href={`/books/${book.id}`}
          className={`flex items-center gap-1.5 text-sm font-medium ${tc.text} opacity-60 hover:opacity-100 transition-opacity flex-shrink-0`}>
          <FiArrowLeft size={16} />
          <span className="hidden sm:inline">{locale === "zh" ? "返回" : "Back"}</span>
        </Link>

        <span className={`flex-1 font-serif font-bold text-sm ${tc.text} truncate`}>{displayTitle}</span>

        {/* Page progress */}
        {totalPages > 0 && (
          <span className={`text-xs ${tc.text} opacity-50 flex-shrink-0 hidden sm:inline`}>
            {currentPage}/{totalPages}
          </span>
        )}

        {/* Font size */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={() => setFontSize(s => Math.max(12, s - 2))}
            className={`p-1.5 rounded-lg ${tc.text} opacity-60 hover:opacity-100 hover:bg-black/5 transition-colors`}>
            <FiMinus size={13} />
          </button>
          <span className={`text-xs font-mono ${tc.text} opacity-50 w-6 text-center`}>{fontSize}</span>
          <button onClick={() => setFontSize(s => Math.min(26, s + 2))}
            className={`p-1.5 rounded-lg ${tc.text} opacity-60 hover:opacity-100 hover:bg-black/5 transition-colors`}>
            <FiPlus size={13} />
          </button>
        </div>

        {/* Theme */}
        <button onClick={cycleTheme}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium ${tc.text} opacity-60 hover:opacity-100 hover:bg-black/5 transition-colors flex-shrink-0`}>
          {themeIcon}
          <span className="hidden sm:inline">{themeLabel}</span>
        </button>

        {/* TTS */}
        {book.fileType !== "external" && (
          <button onClick={() => setShowTts(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0 ${
              showTts
                ? "bg-brand-500 text-white shadow-brand"
                : `${tc.text} opacity-60 hover:opacity-100 hover:bg-black/5`
            }`}>
            {showTts ? <FiVolumeX size={14} /> : <FiVolume2 size={14} />}
            <span>{locale === "zh" ? "听书" : "Listen"}</span>
          </button>
        )}

        {/* Fullscreen */}
        <button onClick={toggleFullscreen}
          className={`p-1.5 rounded-lg ${tc.text} opacity-40 hover:opacity-80 hover:bg-black/5 hidden sm:block flex-shrink-0`}>
          {isFullscreen ? <FiMinimize size={14} /> : <FiMaximize size={14} />}
        </button>
      </div>

      {/* ── Reading content ── */}
      <div className="w-full max-w-3xl mx-auto px-4 py-6 pb-32">
        {!canRead ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4 px-4">
            <div className="text-5xl">📖</div>
            <h3 className={`font-serif text-xl font-bold ${tc.text}`}>
              {locale === "zh" ? "暂无电子版" : "No digital version"}
            </h3>
            <p className={`text-sm ${tc.text} opacity-60 max-w-xs`}>
              {locale === "zh" ? "此书尚未上传电子版文件。" : "No digital file has been uploaded yet."}
            </p>
            <Link href={`/books/${book.id}`}
              className="mt-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors">
              {locale === "zh" ? "返回书籍详情" : "Back to book"}
            </Link>
          </div>
        ) : book.fileUrl && book.fileType === "pdf" ? (
          <PdfReader
            url={book.fileUrl} theme={theme} fontSize={fontSize} locale={locale}
            initialPage={currentPage}
            onPageChange={handlePageChange}
            onTotalPages={setTotalPages}
            onTextExtracted={setTtsText}
          />
        ) : book.fileUrl && book.fileType === "txt" ? (
          <TxtReader
            url={book.fileUrl} theme={theme} fontSize={fontSize} locale={locale}
            initialPage={currentPage}
            onTextExtracted={setTtsText}
            onPageChange={handlePageChange}
            onTotalPages={setTotalPages}
          />
        ) : book.fileUrl && book.fileType === "epub" ? (
          <EpubReader
            url={book.fileUrl} theme={theme} fontSize={fontSize} locale={locale}
            onTextExtracted={setTtsText}
          />
        ) : book.readLink ? (
          <ExternalReader url={book.readLink} title={displayTitle} locale={locale} />
        ) : null}
      </div>

      {/* TTS Player */}
      <AnimatePresence>
        {showTts && (
          <TtsPlayer
            text={ttsText || (locale === "zh" ? "暂无文字内容可供朗读。" : "No text content available.")}
            locale={locale}
            onClose={() => setShowTts(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
