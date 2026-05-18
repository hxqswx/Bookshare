# 📚 BookShare — 共读好书，共同成长

A bilingual (Chinese/English) book sharing and reading motivation community.

## Features

- 🔐 User authentication (register/login)
- 📖 Book library with search & genre filters
- ✍️ Share reading insights, reviews, progress, and quotes
- ❤️ Like posts
- 🏆 Reading leaderboard
- 🌍 Full Chinese/English bilingual support
- 📱 Responsive design

## Tech Stack

- **Next.js 14** (App Router + TypeScript)
- **Prisma** + PostgreSQL
- **NextAuth.js** — credentials-based auth
- **Tailwind CSS** + Framer Motion
- **Vercel** deployment

## Local Development

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your values
3. Install dependencies: `npm install`
4. Push the database schema: `npm run db:push`
5. Seed demo data: `npm run db:seed`
6. Start dev server: `npm run dev`

## Deploy to Vercel

1. Connect your GitHub repo to Vercel
2. Set environment variables in the Vercel dashboard:
   - `DATABASE_URL` — PostgreSQL connection string (Neon, Supabase, etc.)
   - `NEXTAUTH_SECRET` — a random string (use `openssl rand -base64 32`)
   - `NEXTAUTH_URL` — your deployed URL (e.g. `https://bookshare.vercel.app`)
3. Deploy!

## Demo Account

After seeding, you can log in with:
- Email: `alice@bookshare.com`
- Password: `demo123456`
