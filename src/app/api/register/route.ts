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
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailVerification = isEmailConfigured();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerified: true },
    });

    if (existing) {
      if (existing.emailVerified) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
      // Already registered but not verified — resend if email is configured
      if (emailVerification) {
        await sendNewToken(existing.id, normalizedEmail, name.trim());
        return NextResponse.json({ needsVerification: true, email: normalizedEmail });
      }
      // Email not configured — just auto-verify now
      await prisma.user.update({
        where: { id: existing.id },
        data: { emailVerified: new Date() },
      });
      return NextResponse.json({ needsVerification: false, email: normalizedEmail });
    }

    const hashed = await bcrypt.hash(password, 12);

    if (!emailVerification) {
      // Resend not configured — create user as already verified
      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: hashed,
          image: avatarUrl(name.trim()),
          emailVerified: new Date(), // auto-verify
        },
      });
      return NextResponse.json(
        { needsVerification: false, email: user.email },
        { status: 201 }
      );
    }

    // Email configured — create unverified user, send verification email
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashed,
        image: avatarUrl(name.trim()),
        // emailVerified stays null
      },
    });

    try {
      await sendNewToken(user.id, normalizedEmail, name.trim());
    } catch (emailErr) {
      // Email send failed — keep the user account but report the error.
      // They can retry via /check-email resend button once the issue is fixed.
      console.error("Failed to send verification email:", emailErr);
      return NextResponse.json(
        {
          error:
            `账号已创建，但验证邮件发送失败。请稍后在登录页点击“重新发送验证邮件”。` +
            ` Account created but verification email failed. Please try resending from the login page.`,
        },
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

function avatarUrl(name: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundType=gradientLinear`;
}

/** Delete old tokens for this user, create a fresh one, send the email. */
async function sendNewToken(userId: string, email: string, name: string) {
  void userId; // kept for potential future use (e.g. rate limit by userId)
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
