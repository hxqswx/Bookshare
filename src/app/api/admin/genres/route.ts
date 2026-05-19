import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/admin/genres — list with book counts */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const genres = await prisma.genre.findMany({
    orderBy: { order: "asc" },
  });

  // Count books per genre (genre is a plain string field on Book)
  const bookCounts = await prisma.book.groupBy({
    by: ["genre"],
    _count: { genre: true },
  });
  const countMap = Object.fromEntries(
    bookCounts.map((r) => [r.genre, r._count.genre])
  );

  return NextResponse.json(
    genres.map((g) => ({ ...g, bookCount: countMap[g.name] ?? 0 }))
  );
}

/** POST /api/admin/genres — create a genre */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, nameZh } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Set order = max + 1
  const maxOrder = await prisma.genre.aggregate({ _max: { order: true } });
  const order = (maxOrder._max.order ?? 0) + 1;

  try {
    const genre = await prisma.genre.create({
      data: { name: name.trim(), nameZh: nameZh?.trim() || null, order },
    });
    return NextResponse.json({ ...genre, bookCount: 0 });
  } catch {
    return NextResponse.json({ error: "Genre name already exists" }, { status: 409 });
  }
}
