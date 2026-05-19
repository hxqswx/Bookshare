import { prisma } from "@/lib/prisma";
import { BooksClient } from "@/components/BooksClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "书库 / Book Library",
};

export const revalidate = 120;

async function getBooks(query: string, genre: string, readMode: string) {
  try {
    // Reading-mode availability filter
    let readFilter: object = {};
    if (readMode === "online") {
      // Has an uploaded file  OR  has a non-Amazon read link
      readFilter = {
        OR: [
          { fileUrl: { not: null } },
          {
            AND: [
              { readLink: { not: null } },
              { NOT: { readLink: { contains: "amazon", mode: "insensitive" as const } } },
            ],
          },
        ],
      };
    } else if (readMode === "kindle") {
      // readLink points to Amazon/Kindle store
      readFilter = { readLink: { contains: "amazon", mode: "insensitive" as const } };
    }

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
        readFilter,
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
  searchParams: { q?: string; genre?: string; read?: string };
}) {
  const query = searchParams.q || "";
  const genre = searchParams.genre || "";
  const readMode = searchParams.read || "";
  const data = await getBooks(query, genre, readMode);
  return (
    <BooksClient
      initialData={data}
      initialQuery={query}
      initialGenre={genre}
      initialReadMode={readMode}
    />
  );
}
