"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import { FiBook, FiMenu, FiX, FiUser, FiLogOut, FiShare2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { data: session } = useSession();
  const { locale, setLocale, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-md"
          : "bg-white/80 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <FiBook className="text-white text-lg" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              BookShare
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/">{t.nav.home}</NavLink>
            <NavLink href="/books">{t.nav.books}</NavLink>
            <NavLink href="/share">{t.nav.share}</NavLink>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
              className="px-3 py-1.5 rounded-full text-sm font-medium border border-primary-200 text-primary-600 hover:bg-primary-50 transition-colors"
            >
              {locale === "zh" ? "EN" : "中文"}
            </button>

            {session ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/share"
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full text-sm font-medium hover:shadow-md transition-all hover:scale-105"
                >
                  <FiShare2 className="text-xs" />
                  {t.nav.share}
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-xs font-bold">
                      {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {session.user?.name}
                    </span>
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl"
                    >
                      <FiUser className="text-gray-400" />
                      {t.nav.profile}
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-b-xl"
                    >
                      <FiLogOut />
                      {t.nav.logout}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full text-sm font-medium hover:shadow-md transition-all hover:scale-105"
                >
                  {t.nav.register}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              <MobileNavLink href="/" onClick={() => setMobileOpen(false)}>
                {t.nav.home}
              </MobileNavLink>
              <MobileNavLink href="/books" onClick={() => setMobileOpen(false)}>
                {t.nav.books}
              </MobileNavLink>
              <MobileNavLink href="/share" onClick={() => setMobileOpen(false)}>
                {t.nav.share}
              </MobileNavLink>
              <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                <button
                  onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
                  className="px-3 py-1.5 rounded-full text-sm font-medium border border-primary-200 text-primary-600"
                >
                  {locale === "zh" ? "EN" : "中文"}
                </button>
                {session ? (
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-sm text-red-500"
                  >
                    {t.nav.logout}
                  </button>
                ) : (
                  <>
                    <Link href="/login" className="text-sm text-gray-600">
                      {t.nav.login}
                    </Link>
                    <Link
                      href="/register"
                      className="px-3 py-1.5 bg-primary-500 text-white rounded-full text-sm"
                    >
                      {t.nav.register}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-primary-50 hover:text-primary-600 transition-colors"
    >
      {children}
    </Link>
  );
}
