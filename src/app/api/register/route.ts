import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
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
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerified: true },
    });

    if (existing) {
      if (existing.emailVerified) {
        // Fully registered — tell the user
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
      // Registered but not yet verified — resend verification email
      await sendNewToken(existing.id, normalizedEmail, name.trim());
      return NextResponse.json({ needsVerification: true, email: normalizedEmail });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashed,
        image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundType=gradientLinear`,
        // emailVerified stays null — user must click the link
      },
    });

    // Send verification email; if it fails, clean up the user so they can retry
    try {
      await sendNewToken(user.id, normalizedEmail, name.trim());
    } catch (emailErr) {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      console.error("Failed to send verification email:", emailErr);
      return NextResponse.json(
        { error: "无法发送验证邮件，请稍后重试。Could not send verification email, please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { needsVerification: true, email: normalizedEmail },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Delete old token(s) for this user, create a fresh one, send the email. */
async function sendNewToken(userId: string, email: string, name: string) {
  // Remove any stale tokens for this email
  await prisma.verificationToken
    .deleteMany({ where: { identifier: email } })
    .catch(() => {});

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
