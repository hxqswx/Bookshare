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

  await prisma.user.delete({ where: { id: params.id } });
  // Return isSelf so client can sign out if needed
  return NextResponse.json({ ok: true, isSelf: params.id === session.user.id });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (params.id === session.user.id) {
    return NextResponse.json({ error: "Cannot change your own admin status" }, { status: 400 });
  }

  const { isAdmin } = await req.json();
  const user = await prisma.user.update({
    where: { id: params.id },
    data: { isAdmin: Boolean(isAdmin) },
    select: { id: true, isAdmin: true },
  });
  return NextResponse.json(user);
}
