import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/genres — public, returns ordered genre list */
export async function GET() {
  const genres = await prisma.genre.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true, nameZh: true },
  });
  return NextResponse.json(genres);
}
