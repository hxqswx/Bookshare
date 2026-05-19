"use client";

import { useLanguage } from "@/context/LanguageContext";
import { BookReader } from "@/components/reader/BookReader";

interface Book {
  id: string;
  title: string;
  titleZh: string | null;
  author: string;
  authorZh: string | null;
  fileUrl: string | null;
  fileType: string | null;
  readLink: string | null;
}

/**
 * Vercel Blob private-store URLs cannot be fetched directly from the browser.
 * Wrap them with /api/file?url=... so the server generates a presigned URL.
 * Public URLs (e.g. external links) pass through unchanged.
 */
function toReadableUrl(fileUrl: string | null): string | null {
  if (!fileUrl) return null;
  if (fileUrl.includes(".blob.vercel-storage.com")) {
    return `/api/file?url=${encodeURIComponent(fileUrl)}`;
  }
  return fileUrl;
}

export function BookReaderWrapper({
  book,
  initialPage,
}: {
  book: Book;
  initialPage: number;
}) {
  const { locale } = useLanguage();
  const readableBook = {
    ...book,
    fileUrl: toReadableUrl(book.fileUrl),
  };
  return <BookReader book={readableBook} locale={locale} initialPage={initialPage} />;
}
