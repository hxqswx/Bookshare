import { prisma } from "@/lib/prisma";
import { BooksClient } from "@/components/BooksClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "书库 / Book Library",
};

export const revalidate = 120;

async function getBooks(query: string, genre: string) {
  try {
    const where = {
      AND: [
        query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" as const } },
                { titleZh: { contains: query, mode: "insensitive" as const } },
                { author: { contains: query, mode: "insensitive" as const } },
                { authorZh: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {},
        genre ? { genre: { contains: genre, mode: "insensitive" as const } } : {},
      ],
    };

    const [books, genreRecords] = await Promise.all([
      prisma.book.findMany({
        where,
        include: { _count: { select: { userBooks: true, posts: true } } },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      }),
      prisma.genre.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true, nameZh: true } }),
    ]);

    return { books, genres: genreRecords };
  } catch {
    return { books: [], genres: [] };
  }
}

export default async function BooksPage({
  searchParams,
}: {
  searchParams: { q?: string; genre?: string };
}) {
  const query = searchParams.q || "";
  const genre = searchParams.genre || "";
  const data = await getBooks(query, genre);
  return <BooksClient initialData={data} initialQuery={query} initialGenre={genre} />;
}
