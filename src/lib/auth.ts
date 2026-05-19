import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers: any[] = [];

// Google OAuth — requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in env
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Allow Google sign-in to link to an existing email/password account
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.email?.split("@")[0] ?? "Reader",
          email: profile.email,
          image: profile.picture,
        };
      },
    })
  );
}

// Accounts created before email verification was introduced are auto-verified
// on first login so existing users are never locked out.
const VERIFICATION_LAUNCH = new Date("2026-05-19T00:00:00Z");

// Gate is only active when RESEND_API_KEY is present.
const emailVerificationEnabled = !!process.env.RESEND_API_KEY;

// Email / Password
providers.push(
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      const user = await prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          password: true,
          emailVerified: true,
          createdAt: true,
        },
      });
      if (!user || !user.password) return null;
      const ok = await bcrypt.compare(credentials.password, user.password);
      if (!ok) return null;

      // Email verification gate — only active when Resend is configured
      if (emailVerificationEnabled && !user.emailVerified) {
        if (user.createdAt < VERIFICATION_LAUNCH) {
          // Legacy account — silently stamp emailVerified so they aren't locked out
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          }).catch(() => {});
        } else {
          // New account that hasn't verified yet
          throw new Error("EmailNotVerified");
        }
      }

      return { id: user.id, email: user.email, name: user.name, image: user.image };
    },
  })
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Fetch isAdmin once at sign-in — wrapped in try/catch so a
        // missing column (schema not yet pushed) never breaks login.
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { isAdmin: true },
          });
          token.isAdmin = dbUser?.isAdmin ?? false;
        } catch {
          token.isAdmin = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Ensure every OAuth user has a name — wrapped so it never breaks login
      try {
        if (!user.name) {
          await prisma.user.update({
            where: { id: user.id },
            data: { name: user.email?.split("@")[0] ?? "Reader" },
          });
        }
      } catch { /* non-fatal */ }
    },
  },
};
