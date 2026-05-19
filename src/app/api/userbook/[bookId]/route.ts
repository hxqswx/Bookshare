import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/userbook/[bookId] — fetch current user's status for this book */
export async function GET(
  _req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ status: null });
  }

  const userBook = await prisma.userBook.findUnique({
    where: { userId_bookId: { userId: session.user.id, bookId: params.bookId } },
    select: { status: true, progress: true, rating: true },
  });

  return NextResponse.json(userBook ?? { status: null });
}

/** POST /api/userbook/[bookId] — create or update reading status */
export async function POST(
  req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await req.json();
  const validStatuses = ["want_to_read", "reading", "finished"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Confirm book exists
  const book = await prisma.book.findUnique({ where: { id: params.bookId }, select: { id: true } });
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const userBook = await prisma.userBook.upsert({
    where: { userId_bookId: { userId: session.user.id, bookId: params.bookId } },
    update: { status },
    create: { userId: session.user.id, bookId: params.bookId, status },
    select: { status: true },
  });

  return NextResponse.json(userBook);
}

/** PATCH /api/userbook/[bookId] — save reading progress (page number) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { progress } = await req.json();
  await prisma.userBook.updateMany({
    where: { userId: session.user.id, bookId: params.bookId },
    data: { progress: Math.max(0, Math.floor(Number(progress))) },
  });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/userbook/[bookId] — remove from reading list */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.userBook.deleteMany({
    where: { userId: session.user.id, bookId: params.bookId },
  });

  return NextResponse.json({ ok: true });
}
