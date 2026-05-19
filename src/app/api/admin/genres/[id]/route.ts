import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** PATCH /api/admin/genres/[id] — update name / nameZh */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, nameZh } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const genre = await prisma.genre.update({
      where: { id: params.id },
      data: { name: name.trim(), nameZh: nameZh?.trim() || null },
    });
    return NextResponse.json(genre);
  } catch {
    return NextResponse.json({ error: "Name already exists" }, { status: 409 });
  }
}

/** DELETE /api/admin/genres/[id] */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.genre.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
