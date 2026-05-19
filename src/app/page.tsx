import { prisma } from "@/lib/prisma";
import { HomeClient } from "@/components/HomeClient";

export const revalidate = 60; // revalidate every 60 seconds

async function getStats() {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [bookCount, userCount, postCount, newUsersThisMonth, recentPosts, pinnedBooks, popularBooks] =
      await Promise.all([
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
          include: {
            _count: { select: { userBooks: true, posts: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        // Popular books (most readers)
        prisma.book.findMany({
          take: 6,
          orderBy: { userBooks: { _count: "desc" } },
          include: {
            _count: { select: { userBooks: true, posts: true } },
          },
        }),
      ]);

    // Leaderboard: users with most finished books
    const leaderboard = await prisma.user.findMany({
      take: 5,
      include: {
        readingList: {
          where: { status: "finished" },
        },
        _count: { select: { posts: true } },
      },
    });

    const sortedLeaderboard = leaderboard
      .map((u) => ({
        id: u.id,
        name: u.name,
        image: u.image,
        booksFinished: u.readingList.length,
        postCount: u._count.posts,
      }))
      .sort((a, b) => b.booksFinished - a.booksFinished);

    return {
      stats: { bookCount, userCount, postCount, newUsersThisMonth },
      recentPosts,
      pinnedBooks,
      featuredBooks: popularBooks,
      leaderboard: sortedLeaderboard,
    };
  } catch {
    return {
      stats: { bookCount: 0, userCount: 0, postCount: 0, newUsersThisMonth: 0 },
      recentPosts: [],
      pinnedBooks: [],
      featuredBooks: [],
      leaderboard: [],
    };
  }
}

export default async function HomePage() {
  const data = await getStats();
  return <HomeClient data={data} />;
}
