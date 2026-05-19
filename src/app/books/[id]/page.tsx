import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BookDetailClient } from "@/components/BookDetailClient";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bookshare.vercel.app";

async function getBook(id: string) {
  try {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: { select: { id: true, name: true, image: true } },
            _count: { select: { likes: true, comments: true } },
          },
        },
        userBooks: {
          include: { user: { select: { id: true, name: true } } },
        },
        _count: { select: { userBooks: true, posts: true } },
      },
    });
    return book;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const book = await prisma.book.findUnique({
    where: { id: params.id },
    select: {
      title: true,
      titleZh: true,
      author: true,
      authorZh: true,
      description: true,
      descriptionZh: true,
      cover: true,
    },
  });
  if (!book) return {};

  const title = book.titleZh ? `${book.titleZh} / ${book.title}` : book.title;
  const author = book.authorZh ? `${book.authorZh} · ${book.author}` : book.author;
  const description =
    book.descriptionZh || book.description || `${title} — ${author}`;
  const coverUrl = book.cover?.startsWith("/")
    ? `${SITE_URL}${book.cover}`
    : book.cover ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title: `${title} — ${author}`,
      description,
      url: `${SITE_URL}/books/${params.id}`,
      type: "book",
      images: coverUrl ? [{ url: coverUrl, width: 400, height: 600, alt: title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${author}`,
      description,
      images: coverUrl ? [coverUrl] : [],
    },
  };
}

export default async function BookDetailPage({ params }: { params: { id: string } }) {
  const book = await getBook(params.id);
  if (!book) notFound();
  return <BookDetailClient book={book} />;
}
