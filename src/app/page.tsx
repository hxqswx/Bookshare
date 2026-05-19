import { prisma } from "@/lib/prisma";
import { HomeClient } from "@/components/HomeClient";

export const revalidate = 60;

async function getStats() {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Helper: top book by status, returns book + the count for that specific status
    const topByStatus = async (status: string) => {
      const groups = await prisma.userBook.groupBy({
        by: ["bookId"],
        where: { status },
        _count: { bookId: true },
        orderBy: { _count: { bookId: "desc" } },
        take: 1,
      });
      if (!groups[0]) return null;
      const book = await prisma.book.findUnique({
        where: { id: groups[0].bookId },
        include: { _count: { select: { userBooks: true, posts: true } } },
      });
      return book ? { ...book, statusCount: groups[0]._count.bookId } : null;
    };

    const [
      bookCount, userCount, postCount, newUsersThisMonth,
      recentPosts, pinnedBooks, popularBooks,
      topWantToRead, topReading, topFinished,
    ] = await Promise.all([
      prisma.book.count(),
      prisma.user.count(),
      prisma.post.count(),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.post.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, image: true } },
          book: { select: { id: true, title: true, titleZh: true, cover: true, author: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      // Admin-curated featured books
      prisma.book.findMany({
        where: { isFeatured: true },
        include: { _count: { select: { userBooks: true, posts: true } } },
        orderBy: { createdAt: "desc" },
      }),
      // Popular books (most readers) for the main grid
      prisma.book.findMany({
        take: 6,
        orderBy: { userBooks: { _count: "desc" } },
        include: { _count: { select: { userBooks: true, posts: true } } },
      }),
      topByStatus("want_to_read"),
      topByStatus("reading"),
      topByStatus("finished"),
    ]);

    const leaderboard = await prisma.user.findMany({
      take: 5,
      include: {
        readingList: { where: { status: "finished" } },
        _count: { select: { posts: true } },
      },
    });

    const sortedLeaderboard = leaderboard
      .map((u) => ({
        id: u.id, name: u.name, image: u.image,
        booksFinished: u.readingList.length,
        postCount: u._count.posts,
      }))
      .sort((a, b) => b.booksFinished - a.booksFinished);

    return {
      stats: { bookCount, userCount, postCount, newUsersThisMonth },
      recentPosts,
      pinnedBooks,
      featuredBooks: popularBooks,
      readerPicks: { topWantToRead, topReading, topFinished },
      leaderboard: sortedLeaderboard,
    };
  } catch {
    return {
      stats: { bookCount: 0, userCount: 0, postCount: 0, newUsersThisMonth: 0 },
      recentPosts: [],
      pinnedBooks: [],
      featuredBooks: [],
      readerPicks: { topWantToRead: null, topReading: null, topFinished: null },
      leaderboard: [],
    };
  }
}

export default async function HomePage() {
  const data = await getStats();
  return <HomeClient data={data} />;
}
