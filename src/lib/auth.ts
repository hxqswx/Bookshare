import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers: any[] = [];

// Google OAuth — requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // Provide a default name when creating user via adapter
        };
      },
    })
  );
}

// GitHub OAuth — requires GITHUB_ID + GITHUB_SECRET
if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  );
}

// Email / Password (always available)
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
        where: { email: credentials.email },
      });

      if (!user || !user.password) return null;

      const ok = await bcrypt.compare(credentials.password, user.password);
      if (!ok) return null;

      return { id: user.id, email: user.email, name: user.name, image: user.avatar };
    },
  })
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) token.id = user.id;
      // For OAuth sign-in, ensure the user has a name
      if (account && user && !user.name) {
        await prisma.user.update({
          where: { id: user.id },
          data: { name: user.email?.split("@")[0] ?? "Reader" },
        });
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    // Auto-populate name for OAuth users who don't have one
    async createUser({ user }) {
      if (!user.name) {
        await prisma.user.update({
          where: { id: user.id },
          data: { name: user.email?.split("@")[0] ?? "Reader" },
        });
      }
    },
  },
};
