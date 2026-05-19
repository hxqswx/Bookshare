import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const books = await prisma.book.findMany({
    select: {
      id: true,
      title: true,
      titleZh: true,
      author: true,
      authorZh: true,
      cover: true,
      description: true,
      descriptionZh: true,
      genre: true,
      publishYear: true,
      isFeatured: true,
      fileUrl: true,
      fileType: true,
      readLink: true,
      createdAt: true,
      _count: { select: { userBooks: true, posts: true } },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(books);
}
