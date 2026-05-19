import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendVerificationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const verifyEmail = isEmailConfigured();

    // ── Check for existing account ──────────────────────────────────────
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerified: true },
    });

    if (existing) {
      if (existing.emailVerified) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
      // Account exists but unverified — resend verification if email is configured
      if (verifyEmail) {
        await issueAndSend(normalizedEmail, trimmedName);
        return NextResponse.json({ needsVerification: true, email: normalizedEmail });
      }
      // Email not configured — just verify the account now
      await prisma.user.update({
        where: { id: existing.id },
        data: { emailVerified: new Date() },
      });
      return NextResponse.json({ needsVerification: false, email: normalizedEmail });
    }

    // ── Create new account ───────────────────────────────────────────────
    const hashed = await bcrypt.hash(password, 12);
    const image = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedName)}&backgroundType=gradientLinear`;

    if (!verifyEmail) {
      // No Resend key — create as already verified, user can log in right away
      await prisma.user.create({
        data: { name: trimmedName, email: normalizedEmail, password: hashed, image, emailVerified: new Date() },
      });
      return NextResponse.json({ needsVerification: false, email: normalizedEmail }, { status: 201 });
    }

    // Resend configured — create unverified account, then send email
    await prisma.user.create({
      data: { name: trimmedName, email: normalizedEmail, password: hashed, image },
    });

    try {
      await issueAndSend(normalizedEmail, trimmedName);
    } catch (err) {
      console.error("Verification email failed:", err);
      // Email failed — auto-verify so the user can log in immediately
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: { emailVerified: new Date() },
      }).catch(() => {});
      return NextResponse.json({ needsVerification: false, email: normalizedEmail }, { status: 201 });
    }

    return NextResponse.json({ needsVerification: true, email: normalizedEmail }, { status: 201 });
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Delete stale tokens for this email, create a fresh one, and send the email. */
async function issueAndSend(email: string, name: string): Promise<void> {
  await prisma.verificationToken.deleteMany({ where: { identifier: email } }).catch(() => {});

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  await sendVerificationEmail(email, name, token);
}
