import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 8;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { userId: session.user.id },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: {
        book: {
          select: { id: true, title: true, titleZh: true, cover: true, author: true, authorZh: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.post.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({
    posts,
    total,
    page,
    pages: Math.ceil(total / PAGE_SIZE),
  });
}
