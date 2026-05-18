import { prisma } from "@/lib/prisma";
import { BooksClient } from "@/components/BooksClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "书库 / Book Library — BookShare",
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

    const [books, genres] = await Promise.all([
      prisma.book.findMany({
        where,
        include: { _count: { select: { userBooks: true, posts: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.book.findMany({
        where: { genre: { not: null } },
        select: { genre: true },
        distinct: ["genre"],
      }),
    ]);

    return {
      books,
      genres: genres.map((g) => g.genre!).filter(Boolean),
    };
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
