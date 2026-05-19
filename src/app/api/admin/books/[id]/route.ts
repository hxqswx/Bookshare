import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.book.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

/** PATCH /api/admin/books/[id] — update isFeatured and/or genre */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data: { isFeatured?: boolean; genre?: string | null } = {};
  if ("isFeatured" in body) data.isFeatured = Boolean(body.isFeatured);
  if ("genre" in body) data.genre = body.genre || null;

  const book = await prisma.book.update({
    where: { id: params.id },
    data,
    select: { id: true, isFeatured: true, genre: true },
  });
  return NextResponse.json(book);
}
