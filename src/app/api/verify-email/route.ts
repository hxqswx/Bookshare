import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/verify-email?status=invalid`);
  }

  try {
    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record) {
      return NextResponse.redirect(`${APP_URL}/verify-email?status=invalid`);
    }

    if (record.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
      return NextResponse.redirect(
        `${APP_URL}/verify-email?status=expired&email=${encodeURIComponent(record.identifier)}`
      );
    }

    // Mark the user's email as verified
    await prisma.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete the used token
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});

    return NextResponse.redirect(`${APP_URL}/verify-email?status=success`);
  } catch (err) {
    console.error("verify-email error:", err);
    return NextResponse.redirect(`${APP_URL}/verify-email?status=error`);
  }
}
