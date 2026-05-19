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

/** PATCH /api/admin/books/[id] — update any combination of book fields */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Build update payload from whichever fields were sent
  const data: Record<string, unknown> = {};

  if ("isFeatured"    in body) data.isFeatured    = Boolean(body.isFeatured);
  if ("genre"         in body) data.genre         = body.genre        || null;
  if ("title"         in body) data.title         = String(body.title).trim();
  if ("titleZh"       in body) data.titleZh       = body.titleZh      ? String(body.titleZh).trim()       : null;
  if ("author"        in body) data.author        = String(body.author).trim();
  if ("authorZh"      in body) data.authorZh      = body.authorZh     ? String(body.authorZh).trim()      : null;
  if ("cover"         in body) data.cover         = body.cover        ? String(body.cover).trim()         : null;
  if ("description"   in body) data.description   = body.description  ? String(body.description).trim()  : null;
  if ("descriptionZh" in body) data.descriptionZh = body.descriptionZh ? String(body.descriptionZh).trim() : null;
  if ("publishYear"   in body) data.publishYear   = body.publishYear  ? Number(body.publishYear)          : null;
  if ("fileUrl"       in body) data.fileUrl       = body.fileUrl      ? String(body.fileUrl).trim()       : null;
  if ("fileType"      in body) data.fileType      = body.fileType     ? String(body.fileType).trim()      : null;
  if ("readLink"      in body) data.readLink      = body.readLink     ? String(body.readLink).trim()      : null;

  const book = await prisma.book.update({
    where: { id: params.id },
    data,
    select: {
      id: true, title: true, titleZh: true, author: true, authorZh: true,
      cover: true, description: true, descriptionZh: true,
      genre: true, publishYear: true, isFeatured: true,
      fileUrl: true, fileType: true, readLink: true,
    },
  });
  return NextResponse.json(book);
}
