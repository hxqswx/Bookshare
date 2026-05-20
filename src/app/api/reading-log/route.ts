import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Parse "YYYY-MM-DD" → UTC midnight Date */
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Today in UTC as "YYYY-MM-DD" */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── GET /api/reading-log?year=2026&month=5 ───────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const year  = parseInt(req.nextUrl.searchParams.get("year")  ?? String(new Date().getUTCFullYear()));
  const month = parseInt(req.nextUrl.searchParams.get("month") ?? String(new Date().getUTCMonth() + 1));

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end   = new Date(Date.UTC(year, month,     1)); // exclusive

  const logs = await prisma.readingLog.findMany({
    where: {
      userId: session.user.id,
      date:   { gte: start, lt: end },
    },
    orderBy: { date: "asc" },
    select:  { date: true, pages: true, note: true },
  });

  return NextResponse.json(
    logs.map(l => ({
      date:  l.date.toISOString().slice(0, 10),
      pages: l.pages,
      note:  l.note ?? "",
    }))
  );
}

// ── POST /api/reading-log ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pages, note, date: dateStr } = await req.json();
  const pagesNum = Number(pages);

  if (!Number.isInteger(pagesNum) || pagesNum < 1 || pagesNum > 9999) {
    return NextResponse.json({ error: "Pages must be between 1 and 9999" }, { status: 400 });
  }

  // Guard: ensure the user record still exists (catches stale JWT after DB reset)
  const userExists = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true },
  });
  if (!userExists) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  try {
    const dateKey = dateStr || todayUTC();
    const dateObj = parseDate(dateKey);

    const log = await prisma.readingLog.upsert({
      where:  { userId_date: { userId: session.user.id, date: dateObj } },
      create: { userId: session.user.id, date: dateObj, pages: pagesNum, note: note?.trim() || null },
      update: { pages: pagesNum, note: note?.trim() || null },
      select: { date: true, pages: true, note: true },
    });

    return NextResponse.json({
      date:  log.date.toISOString().slice(0, 10),
      pages: log.pages,
      note:  log.note ?? "",
    });
  } catch (err) {
    console.error("[reading-log POST]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
