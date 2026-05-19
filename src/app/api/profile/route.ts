import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, image } = await req.json();

  if (name !== undefined && (!name?.trim() || name.trim().length > 50)) {
    return NextResponse.json({ error: "Name must be 1–50 characters" }, { status: 400 });
  }

  const data: { name?: string; image?: string | null } = {};
  if (name !== undefined) data.name = name.trim();
  // null clears the custom image (falls back to initials avatar)
  if (image !== undefined) data.image = image?.trim() || null;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, image: true },
  });

  return NextResponse.json(updated);
}
