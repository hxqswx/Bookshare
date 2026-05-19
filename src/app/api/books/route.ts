import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const genre = searchParams.get("genre") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 100);

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

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { userBooks: true, posts: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.book.count({ where }),
    ]);

    return NextResponse.json({ books, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, titleZh, author, authorZh, cover, description, descriptionZh, genre, publishYear, fileUrl, fileType, readLink } = body;

    if (!title?.trim() || !author?.trim()) {
      return NextResponse.json({ error: "Title and author are required" }, { status: 400 });
    }

    const book = await prisma.book.create({
      data: {
        title: title.trim(),
        titleZh: titleZh?.trim() || null,
        author: author.trim(),
        authorZh: authorZh?.trim() || null,
        cover: cover?.trim() || null,
        description: description?.trim() || null,
        descriptionZh: descriptionZh?.trim() || null,
        genre: genre?.trim() || null,
        publishYear: publishYear ? parseInt(String(publishYear)) : null,
        fileUrl: fileUrl?.trim() || null,
        fileType: fileType?.trim() || null,
        readLink: readLink?.trim() || null,
      },
    });
    return NextResponse.json(book);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }
}
