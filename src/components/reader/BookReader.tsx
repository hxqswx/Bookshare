"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft, FiChevronLeft, FiChevronRight,
  FiMinus, FiPlus, FiSun, FiMoon, FiVolume2, FiVolumeX,
  FiMaximize, FiMinimize, FiBookOpen,
} from "react-icons/fi";
import { TtsPlayer } from "./TtsPlayer";
import toast from "react-hot-toast";

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
  light: { bg: "bg-white",       text: "text-gray-800",  border: "border-gray-200", bar: "bg-white/95"    },
  sepia: { bg: "bg-amber-50",    text: "text-amber-900", border: "border-amber-200", bar: "bg-amber-50/95" },
  dark:  { bg: "bg-gray-950",    text: "text-gray-100",  border: "border-gray-800", bar: "bg-gray-950/95"  },
};

// ─── PDF Reader (lazy imported) ───────────────────────────────────────────────

function PdfReader({
  url, theme, fontSize, locale,
  onPageChange, onTotalPages, onTextExtracted,
}: {
  url: string; theme: Theme; fontSize: number; locale: string;
  onPageChange: (p: number) => void;
  onTotalPages: (t: number) => void;
  onTextExtracted: (text: string) => void;
}) {
  // Dynamically import react-pdf to avoid SSR issues
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

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const tc = THEMES[theme];

  useEffect(() => {
    // Dynamic import on client only
    import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
      setPdfModule({ Document: mod.Document as never, Page: mod.Page as never });
    });
  }, []);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setWidth(Math.min(containerRef.current.clientWidth - 32, 800));
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const changePage = useCallback((delta: number) => {
    setPageNumber(p => {
      const next = Math.max(1, Math.min(numPages, p + delta));
      onPageChange(next);
      return next;
    });
  }, [numPages, onPageChange]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") changePage(1);
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   changePage(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changePage]);

  if (!pdfModule) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { Document, Page } = pdfModule;

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages);
          onTotalPages(numPages);
        }}
        onLoadError={(err) => console.error("PDF error:", err)}
        loading={
          <div className="flex items-center justify-center h-64 gap-3">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className={`text-sm ${tc.text}`}>{locale === "zh" ? "正在加载…" : "Loading…"}</span>
          </div>
        }
        error={
          <div className={`text-center py-16 ${tc.text}`}>
            <div className="text-4xl mb-3">😞</div>
            <p>{locale === "zh" ? "PDF 加载失败" : "Failed to load PDF"}</p>
          </div>
        }
      >
        <Page
          pageNumber={pageNumber}
          width={width}
          renderTextLayer
          renderAnnotationLayer={false}
          onGetTextSuccess={(content) => {
            const txt = content.items.map(i => i.str).join(" ");
            onTextExtracted(txt);
          }}
          className={`shadow-2xl rounded-lg overflow-hidden`}
        />
      </Document>

      {/* Page navigation */}
      {numPages > 0 && (
        <div className={`flex items-center gap-4 mt-6 px-5 py-3 rounded-2xl border ${tc.border} ${tc.bar} shadow-sm`}>
          <button onClick={() => changePage(-1)} disabled={pageNumber <= 1}
            className={`p-2 rounded-xl transition-colors disabled:opacity-30 ${tc.text} hover:bg-black/5`}>
            <FiChevronLeft size={18} />
          </button>
          <span className={`text-sm font-medium ${tc.text} min-w-[80px] text-center`}>
            {locale === "zh" ? `第 ${pageNumber} / ${numPages} 页` : `${pageNumber} / ${numPages}`}
          </span>
          <button onClick={() => changePage(1)} disabled={pageNumber >= numPages}
            className={`p-2 rounded-xl transition-colors disabled:opacity-30 ${tc.text} hover:bg-black/5`}>
            <FiChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── TXT Reader ───────────────────────────────────────────────────────────────

function TxtReader({
  url, theme, fontSize, locale, onTextExtracted,
}: {
  url: string; theme: Theme; fontSize: number; locale: string;
  onTextExtracted: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const tc = THEMES[theme];

  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then(r => r.text())
      .then(t => { setText(t); onTextExtracted(t.slice(0, 8000)); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [url, onTextExtracted]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <span className={`text-sm ${tc.text}`}>{locale === "zh" ? "正在加载…" : "Loading…"}</span>
    </div>
  );

  if (error) return (
    <div className={`text-center py-16 ${tc.text}`}>
      <div className="text-4xl mb-3">😞</div>
      <p>{locale === "zh" ? "文件加载失败" : "Failed to load file"}</p>
    </div>
  );

  return (
    <div
      className={`max-w-2xl mx-auto leading-relaxed whitespace-pre-wrap font-sans ${tc.text}`}
      style={{ fontSize }}
    >
      {text}
    </div>
  );
}

// ─── EPUB Reader ──────────────────────────────────────────────────────────────

function EpubReader({
  url, theme, fontSize, locale, onTextExtracted,
}: {
  url: string; theme: Theme; fontSize: number; locale: string;
  onTextExtracted: (text: string) => void;
}) {
  const [ReactReader, setReactReader] = useState<React.ComponentType<{
    url: string;
    title?: string;
    location: string | number;
    locationChanged: (l: string) => void;
    readerStyles?: Record<string, unknown>;
    getRendition?: (rendition: { hooks: { content: { register: (fn: (c: { document: Document }) => void) => void } } }) => void;
  }> | null>(null);
  const [location, setLocation] = useState<string | number>(0);
  const tc = THEMES[theme];

  useEffect(() => {
    import("react-reader").then(mod => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setReactReader(() => mod.ReactReader as any);
    });
  }, []);

  const epubStyles: Record<string, unknown> = {
    readerArea: {
      background: theme === "dark" ? "#030712" : theme === "sepia" ? "#fffbeb" : "#ffffff",
    },
    reader: { color: theme === "dark" ? "#f3f4f6" : theme === "sepia" ? "#451a03" : "#1f2937" },
  };

  if (!ReactReader) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ height: "calc(100vh - 160px)", minHeight: "400px" }}>
      <ReactReader
        url={url}
        location={location}
        locationChanged={(l) => setLocation(l)}
        readerStyles={epubStyles}
        getRendition={(rendition) => {
          rendition.hooks.content.register((contents) => {
            const bodyText = contents.document.body?.innerText ?? "";
            if (bodyText) onTextExtracted(bodyText.slice(0, 8000));
          });
        }}
      />
    </div>
  );
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
            ? (isKindle ? "此书可在 Kindle 上阅读，点击前往购买或阅读" : "此书在外部网站上阅读，点击打开")
            : (isKindle ? "This book is available on Kindle. Click to purchase or read." : "This book is hosted externally. Click to open.")}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold text-sm transition-all hover:shadow-brand"
        >
          <FiBookOpen />
          {locale === "zh" ? (isKindle ? "在 Kindle 阅读" : "打开阅读") : (isKindle ? "Open in Kindle" : "Open to Read")}
        </a>
      </div>
    </div>
  );
}

// ─── Main BookReader ──────────────────────────────────────────────────────────

export function BookReader({ book, locale, initialPage }: {
  book: ReaderBook;
  locale: string;
  initialPage?: number;
}) {
  const { data: session } = useSession();
  const [theme, setTheme] = useState<Theme>("light");
  const [fontSize, setFontSize] = useState(16);
  const [showTts, setShowTts] = useState(false);
  const [ttsText, setTtsText] = useState("");
  const [currentPage, setCurrentPage] = useState(initialPage ?? 1);
  const [totalPages, setTotalPages] = useState(0);
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

  const handleTextExtracted = useCallback((text: string) => {
    setTtsText(text);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const cycleTheme = () => {
    setTheme(t => t === "light" ? "sepia" : t === "sepia" ? "dark" : "light");
  };

  const themeIcon = theme === "dark" ? <FiMoon size={16} /> : <FiSun size={16} />;
  const themeLabel = theme === "light" ? (locale === "zh" ? "护眼" : "Sepia")
                   : theme === "sepia" ? (locale === "zh" ? "夜间" : "Dark")
                   : (locale === "zh" ? "日间" : "Light");

  const canRead = !!book.fileUrl || !!book.readLink;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${tc.bg}`}>
      {/* Top toolbar */}
      <div className={`sticky top-0 z-40 ${tc.bar} backdrop-blur-md border-b ${tc.border} px-4 h-14 flex items-center gap-3`}>
        <Link href={`/books/${book.id}`}
          className={`flex items-center gap-1.5 text-sm font-medium ${tc.text} opacity-60 hover:opacity-100 transition-opacity flex-shrink-0`}>
          <FiArrowLeft size={16} />
          <span className="hidden sm:inline">{locale === "zh" ? "返回" : "Back"}</span>
        </Link>

        <span className={`flex-1 font-serif font-bold text-sm ${tc.text} truncate`}>{displayTitle}</span>

        {totalPages > 0 && (
          <span className={`text-xs ${tc.text} opacity-50 flex-shrink-0`}>
            {currentPage}/{totalPages}
          </span>
        )}

        {/* Font size */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setFontSize(s => Math.max(12, s - 2))}
            className={`p-1.5 rounded-lg transition-colors ${tc.text} opacity-60 hover:opacity-100 hover:bg-black/5`}>
            <FiMinus size={13} />
          </button>
          <span className={`text-xs font-mono ${tc.text} opacity-50 w-7 text-center`}>{fontSize}</span>
          <button onClick={() => setFontSize(s => Math.min(26, s + 2))}
            className={`p-1.5 rounded-lg transition-colors ${tc.text} opacity-60 hover:opacity-100 hover:bg-black/5`}>
            <FiPlus size={13} />
          </button>
        </div>

        {/* Theme toggle */}
        <button onClick={cycleTheme}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${tc.text} opacity-60 hover:opacity-100 hover:bg-black/5 flex-shrink-0`}>
          {themeIcon}
          <span className="hidden sm:inline">{themeLabel}</span>
        </button>

        {/* TTS toggle */}
        {book.fileType !== "external" && (
          <button
            onClick={() => setShowTts(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0 ${
              showTts
                ? "bg-brand-500 text-white shadow-brand"
                : `${tc.text} opacity-60 hover:opacity-100 hover:bg-black/5`
            }`}
          >
            {showTts ? <FiVolumeX size={14} /> : <FiVolume2 size={14} />}
            <span>{locale === "zh" ? "听书" : "Listen"}</span>
          </button>
        )}

        {/* Fullscreen */}
        <button onClick={toggleFullscreen}
          className={`p-1.5 rounded-lg transition-colors ${tc.text} opacity-40 hover:opacity-80 hover:bg-black/5 hidden sm:block flex-shrink-0`}>
          {isFullscreen ? <FiMinimize size={14} /> : <FiMaximize size={14} />}
        </button>
      </div>

      {/* Reading content */}
      <div
        className={`w-full max-w-3xl mx-auto px-4 py-6 pb-32`}
        style={{ fontSize: `${fontSize}px` }}
      >
        {!canRead ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4 px-4">
            <div className="text-5xl">📖</div>
            <h3 className={`font-serif text-xl font-bold ${tc.text}`}>
              {locale === "zh" ? "暂无电子版" : "No digital version"}
            </h3>
            <p className={`text-sm ${tc.text} opacity-60 max-w-xs`}>
              {locale === "zh" ? "此书尚未上传电子版文件，你可以在书籍详情页添加。" : "No digital file has been uploaded for this book yet."}
            </p>
            <Link href={`/books/${book.id}`}
              className="mt-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors">
              {locale === "zh" ? "返回书籍详情" : "Back to book"}
            </Link>
          </div>
        ) : book.fileUrl && book.fileType === "pdf" ? (
          <PdfReader
            url={book.fileUrl}
            theme={theme}
            fontSize={fontSize}
            locale={locale}
            onPageChange={handlePageChange}
            onTotalPages={setTotalPages}
            onTextExtracted={handleTextExtracted}
          />
        ) : book.fileUrl && book.fileType === "txt" ? (
          <TxtReader
            url={book.fileUrl}
            theme={theme}
            fontSize={fontSize}
            locale={locale}
            onTextExtracted={handleTextExtracted}
          />
        ) : book.fileUrl && book.fileType === "epub" ? (
          <EpubReader
            url={book.fileUrl}
            theme={theme}
            fontSize={fontSize}
            locale={locale}
            onTextExtracted={handleTextExtracted}
          />
        ) : book.readLink ? (
          <ExternalReader
            url={book.readLink}
            title={displayTitle}
            locale={locale}
          />
        ) : null}
      </div>

      {/* TTS Player (slides up from bottom) */}
      <AnimatePresence>
        {showTts && (
          <TtsPlayer
            text={ttsText || (locale === "zh" ? "暂无文字内容可供朗读。" : "No text content available to read.")}
            locale={locale}
            onClose={() => setShowTts(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
