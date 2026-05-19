import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BookDetailClient } from "@/components/BookDetailClient";

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

export default async function BookDetailPage({ params }: { params: { id: string } }) {
  const book = await getBook(params.id);
  if (!book) notFound();
  return <BookDetailClient book={book} />;
}
