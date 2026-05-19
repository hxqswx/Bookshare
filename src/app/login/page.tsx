"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import toast from "react-hot-toast";

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function LoginPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", {
      email: form.email.toLowerCase(),
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

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex bg-warm-gradient">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[44%] bg-forest-gradient items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div key={i}
              className="absolute text-5xl select-none opacity-10"
              style={{ left: `${(i * 19 + 5) % 90}%`, top: `${(i * 23 + 8) % 90}%`, transform: `rotate(${i * 15}deg)` }}>
              📚
            </div>
          ))}
        </div>
        <div className="relative z-10 text-center px-12 max-w-sm">
          <div className="text-7xl mb-6">📚</div>
          <h2 className="font-serif text-4xl font-bold text-white mb-4 leading-tight">
            {locale === "zh" ? "欢迎回来" : "Welcome Back"}
          </h2>
          <p className="text-forest-200 text-lg leading-relaxed">
            {locale === "zh"
              ? "你的书单在等你，书友们也在等你的分享"
              : "Your reading list and fellow readers are waiting for you"}
          </p>
          <div className="mt-10 flex justify-center gap-4">
            {["📖","✨","🌟","🔥","💡"].map((e, i) => (
              <span key={i} className="text-2xl"
                style={{ animation: `float ${3+i}s ease-in-out infinite`, animationDelay: `${i*0.4}s` }}>
                {e}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-3xl">📚</span>
              <span className="font-serif font-bold text-2xl text-forest-800">BookShare</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-cream-200 shadow-card p-8">
            <h1 className="font-serif text-2xl font-bold text-forest-900 mb-1">{t.auth.login_title}</h1>
            <p className="text-sm text-gray-400 mb-8">{t.auth.login_subtitle}</p>

            {/* Google SSO */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="btn-sso mb-6"
            >
              {googleLoading
                ? <span className="w-5 h-5 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin flex-shrink-0" />
                : <GoogleIcon />}
              <span>{locale === "zh" ? "使用 Google 账号登录" : "Continue with Google"}</span>
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cream-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs text-gray-400">
                  {locale === "zh" ? "或使用邮箱登录" : "or sign in with email"}
                </span>
              </div>
            </div>

            {/* Email/password */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t.auth.email}
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
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
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t.auth.password}
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  <input
                    type={showPw ? "text" : "password"} required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="input pl-10 pr-11"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPw ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full btn-brand py-3.5 rounded-xl text-sm mt-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <>{t.auth.login_btn} <FiArrowRight /></>}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              {t.auth.no_account}{" "}
              <Link href="/register" className="text-brand-500 font-semibold hover:text-brand-600 transition-colors">
                {t.auth.go_register}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
