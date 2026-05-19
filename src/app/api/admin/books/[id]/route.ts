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

/** PATCH /api/admin/books/[id] — toggle isFeatured */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { isFeatured } = await req.json();
  const book = await prisma.book.update({
    where: { id: params.id },
    data: { isFeatured: Boolean(isFeatured) },
    select: { id: true, isFeatured: true },
  });
  return NextResponse.json(book);
}
