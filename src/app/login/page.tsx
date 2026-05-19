"use client";

import { useState } from "react";
import { signIn, getProviders } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import toast from "react-hot-toast";
import type { ClientSafeProvider } from "next-auth/react";

/* Google & GitHub SVG icons */
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

export default function LoginPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);

  /* Email/password login */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    if (result?.ok) {
      toast.success(locale === "zh" ? "登录成功！" : "Signed in!");
      router.push("/");
      router.refresh();
    } else {
      toast.error(locale === "zh" ? "邮箱或密码错误" : "Invalid email or password");
      setLoading(false);
    }
  };

  /* SSO login */
  const handleSSO = async (provider: string) => {
    setSsoLoading(provider);
    await signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex bg-warm-gradient">
      {/* ── Left panel (decorative, hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-forest-gradient items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute text-6xl opacity-40 select-none"
              style={{ left: `${(i * 17 + 5) % 100}%`, top: `${(i * 23 + 8) % 100}%`, transform: `rotate(${i * 13}deg)` }}>
              📚
            </div>
          ))}
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="text-7xl mb-6">📚</div>
          <h2 className="font-serif text-4xl font-bold text-white mb-4">
            {locale === "zh" ? "欢迎回来" : "Welcome back"}
          </h2>
          <p className="text-forest-200 text-lg leading-relaxed max-w-sm">
            {locale === "zh"
              ? "你的书单在等你，书友们也在等你的分享"
              : "Your reading list is waiting, and so are your fellow readers"}
          </p>
          <div className="mt-10 flex justify-center gap-3">
            {["📖", "✨", "🌟", "🔥", "💡"].map((e, i) => (
              <span key={i} className="text-2xl animate-float" style={{ animationDelay: `${i * 0.4}s` }}>{e}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo (mobile only) */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-3xl">📚</span>
              <span className="font-serif font-bold text-2xl text-forest-800">BookShare</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-8 border border-cream-200">
            <h1 className="font-serif text-2xl font-bold text-forest-900 mb-1">{t.auth.login_title}</h1>
            <p className="text-sm text-gray-400 mb-8">{t.auth.login_subtitle}</p>

            {/* ── SSO buttons ── */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleSSO("google")}
                disabled={ssoLoading !== null}
                className="btn-sso"
              >
                {ssoLoading === "google"
                  ? <span className="w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                  : <GoogleIcon />}
                {locale === "zh" ? "使用 Google 继续" : "Continue with Google"}
              </button>
              <button
                onClick={() => handleSSO("github")}
                disabled={ssoLoading !== null}
                className="btn-sso"
              >
                {ssoLoading === "github"
                  ? <span className="w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                  : <GitHubIcon />}
                {locale === "zh" ? "使用 GitHub 继续" : "Continue with GitHub"}
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cream-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs text-gray-400">{t.auth.or}</span>
              </div>
            </div>

            {/* ── Email/password form ── */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  {t.auth.email}
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="email" required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  {t.auth.password}
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type={showPw ? "text" : "password"} required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="input pl-10 pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-brand py-3.5 rounded-xl text-base mt-2"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <>{t.auth.login_btn} <FiArrowRight /></>}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              {t.auth.no_account}{" "}
              <Link href="/register" className="text-brand-500 font-semibold hover:text-brand-600">
                {t.auth.go_register}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
