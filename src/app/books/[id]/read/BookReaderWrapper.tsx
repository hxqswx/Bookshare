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

export function BookReaderWrapper({
  book,
  initialPage,
}: {
  book: Book;
  initialPage: number;
}) {
  const { locale } = useLanguage();
  return <BookReader book={book} locale={locale} initialPage={initialPage} />;
}
