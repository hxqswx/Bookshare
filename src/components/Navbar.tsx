"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX, FiChevronDown } from "react-icons/fi";

export function Navbar() {
  const { data: session } = useSession();
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-cream-200"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-sm group-hover:shadow-brand transition-shadow">
            <span className="text-white text-lg leading-none">📚</span>
          </div>
          <span className="font-serif font-bold text-xl text-forest-800 tracking-tight">
            我们真的爱读书
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavItem href="/">{t.nav.home}</NavItem>
          <NavItem href="/books">{t.nav.books}</NavItem>
          <NavItem href="/share">{t.nav.share}</NavItem>
        </nav>

        {/* Right */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language */}
          <button
            onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
            className="text-sm font-medium text-gray-500 hover:text-brand-500 px-2 py-1 rounded-lg hover:bg-cream-100 transition-colors"
          >
            {locale === "zh" ? "EN" : "中文"}
          </button>

          {session ? (
            <div className="relative group">
              <button className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl hover:bg-cream-100 transition-colors">
                <Avatar name={session.user?.name} image={session.user?.image} size={32} />
                <FiChevronDown className="text-gray-400 text-xs group-hover:text-brand-500 transition-colors" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-card-hover border border-cream-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-cream-100">
                  <p className="text-xs text-gray-400">{locale === "zh" ? "已登录为" : "Signed in as"}</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{session.user?.name}</p>
                </div>
                <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-cream-50 hover:text-forest-600 transition-colors">
                  👤 {t.nav.profile}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  🚪 {t.nav.logout}
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm py-2 px-4">
                {t.nav.login}
              </Link>
              <Link href="/register" className="btn-brand text-sm py-2 px-4">
                {t.nav.register}
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg hover:bg-cream-100 text-gray-600 transition-colors"
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-cream-200 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {[
                { href: "/", label: t.nav.home },
                { href: "/books", label: t.nav.books },
                { href: "/share", label: t.nav.share },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-cream-100 hover:text-forest-600 transition-colors"
                >
                  {label}
                </Link>
              ))}

              <div className="pt-3 border-t border-cream-100 space-y-1">
                <button
                  onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
                  className="text-sm font-medium text-gray-500 px-3 py-1.5 border border-cream-300 rounded-full"
                >
                  {locale === "zh" ? "EN" : "中文"}
                </button>

                {session ? (
                  <div className="pt-1 space-y-1">
                    {/* User info row */}
                    <div className="flex items-center gap-3 px-4 py-2">
                      <Avatar name={session.user?.name} image={session.user?.image} size={36} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{session.user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                      </div>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-cream-100 hover:text-forest-600 transition-colors"
                    >
                      👤 {t.nav.profile}
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-500 font-medium hover:bg-red-50 transition-colors"
                    >
                      🚪 {t.nav.logout}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pt-1">
                    <Link href="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-gray-600 px-4 py-2">
                      {t.nav.login}
                    </Link>
                    <Link href="/register" onClick={() => setOpen(false)} className="btn-brand text-sm py-2 px-4">
                      {t.nav.register}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-forest-700 hover:bg-cream-100 transition-all"
    >
      {children}
    </Link>
  );
}

export function Avatar({
  name,
  image,
  size = 36,
}: {
  name?: string | null;
  image?: string | null;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);

  // Reset error state when image URL changes
  useEffect(() => { setImgError(false); }, [image]);

  if (image && !imgError) {
    return (
      <img
        src={image}
        alt={name ?? "Avatar"}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
        onError={() => setImgError(true)}
      />
    );
  }

  const colors = [
    "from-brand-400 to-brand-600",
    "from-forest-400 to-forest-600",
    "from-purple-400 to-purple-600",
    "from-blue-400 to-blue-600",
    "from-rose-400 to-rose-600",
  ];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-white font-bold flex-shrink-0`}
    >
      <span style={{ fontSize: size * 0.42 }}>{name?.[0]?.toUpperCase() ?? "?"}</span>
    </div>
  );
}
