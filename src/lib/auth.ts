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

// Email / Password — login never requires email verification;
// verification is only asked during registration.
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
        select: { id: true, email: true, name: true, image: true, password: true },
      });
      if (!user || !user.password) return null;
      const ok = await bcrypt.compare(credentials.password, user.password);
      if (!ok) return null;
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
    async jwt({ token, user, trigger }) {
      if (user) {
        // Initial sign-in
        token.id = user.id;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { isAdmin: true, name: true, image: true },
          });
          token.isAdmin = dbUser?.isAdmin ?? false;
          if (dbUser?.name)  token.name  = dbUser.name;
          if (dbUser?.image !== undefined) token.picture = dbUser.image;
        } catch {
          token.isAdmin = false;
        }
      }
      if (trigger === "update") {
        // Profile edited — re-fetch latest name/image from DB
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { name: true, image: true, isAdmin: true },
          });
          if (dbUser) {
            token.name    = dbUser.name;
            token.picture = dbUser.image ?? undefined;
            token.isAdmin = dbUser.isAdmin;
          }
        } catch { /* non-fatal */ }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id      = token.id      as string;
        session.user.isAdmin = token.isAdmin as boolean;
        if (token.name)    session.user.name  = token.name  as string;
        if (token.picture !== undefined)
          session.user.image = token.picture as string | null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
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
