import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000; // 1 minute between resends

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, emailVerified: true },
    });

    // Generic response to avoid email enumeration
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 409 });
    }

    // Cooldown: check if a token was issued recently
    const existing = await prisma.verificationToken.findFirst({
      where: { identifier: normalizedEmail },
    });

    if (existing) {
      const age = Date.now() - (existing.expires.getTime() - TOKEN_TTL_MS);
      if (age < COOLDOWN_MS) {
        return NextResponse.json(
          { error: "请等待 1 分钟后再重试。Please wait a minute before trying again." },
          { status: 429 }
        );
      }
      await prisma.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });
    }

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    await sendVerificationEmail(normalizedEmail, user.name, token);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("resend-verification error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
