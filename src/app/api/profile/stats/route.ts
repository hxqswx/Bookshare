import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [wantToRead, reading, finished, postCount] = await Promise.all([
    prisma.userBook.count({ where: { userId: session.user.id, status: "want_to_read" } }),
    prisma.userBook.count({ where: { userId: session.user.id, status: "reading" } }),
    prisma.userBook.count({ where: { userId: session.user.id, status: "finished" } }),
    prisma.post.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ wantToRead, reading, finished, postCount });
}
