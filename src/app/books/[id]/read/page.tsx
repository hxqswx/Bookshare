import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BookReaderWrapper } from "./BookReaderWrapper";

async function getBook(id: string) {
  try {
    return await prisma.book.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        titleZh: true,
        author: true,
        authorZh: true,
        fileUrl: true,
        fileType: true,
        readLink: true,
      },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const book = await prisma.book.findUnique({
    where: { id: params.id },
    select: { title: true, titleZh: true },
  }).catch(() => null);
  const title = book?.titleZh ? `${book.titleZh} · 阅读` : `${book?.title ?? "Book"} · Read`;
  return { title };
}

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  const book = await getBook(params.id);
  if (!book) notFound();

  const initialPage = parseInt(searchParams.page ?? "1") || 1;

  return <BookReaderWrapper book={book} initialPage={initialPage} />;
}
