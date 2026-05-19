"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowRight, FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const PERKS_ZH = ["免费使用全部功能", "与书友实时互动", "专属阅读进度追踪", "排行榜激励阅读"];
const PERKS_EN = ["All features completely free", "Connect with fellow readers", "Track your reading progress", "Leaderboard to keep you motivated"];

export default function RegisterPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const perks = locale === "zh" ? PERKS_ZH : PERKS_EN;

  const pwMatch = !form.confirm || form.password === form.confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwMatch) { toast.error(locale === "zh" ? "两次密码不一致" : "Passwords don't match"); return; }
    if (form.password.length < 8) { toast.error(locale === "zh" ? "密码至少 8 位" : "Password must be 8+ characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.toLowerCase(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error === "Email already registered"
          ? (locale === "zh" ? "该邮箱已被注册" : "Email already registered")
          : (data.error || (locale === "zh" ? "注册失败" : "Registration failed")));
        setLoading(false);
        return;
      }
      toast.success(locale === "zh" ? "注册成功！正在登录…" : "Account created! Signing in…");
      await signIn("credentials", { email: form.email.toLowerCase(), password: form.password, callbackUrl: "/" });
    } catch {
      toast.error(locale === "zh" ? "网络错误，请重试" : "Network error, please try again");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex bg-warm-gradient">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[42%] bg-gradient-to-br from-brand-500 to-brand-700 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute text-5xl select-none opacity-10"
              style={{ left: `${(i * 17 + 7) % 90}%`, top: `${(i * 29 + 5) % 90}%`, transform: `rotate(${i * 13}deg)` }}>
              📖
            </div>
          ))}
        </div>
        <div className="relative z-10 px-12 text-white max-w-sm">
          <div className="text-6xl mb-6">🌟</div>
          <h2 className="font-serif text-4xl font-bold mb-4 leading-tight">
            {locale === "zh" ? "加入书友社区" : "Join the Community"}
          </h2>
          <p className="text-white/80 text-lg mb-10 leading-relaxed">
            {locale === "zh" ? "与全球书友一起阅读、分享、成长" : "Read, share, and grow with readers worldwide"}
          </p>
          <ul className="space-y-3.5">
            {perks.map((perk, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-white/90">
                <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="text-white text-xs" />
                </div>
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-4 py-16 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[400px]"
        >
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-3xl">📚</span>
              <span className="font-serif font-bold text-2xl text-forest-800">BookShare</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-cream-200 shadow-card p-8">
            <h1 className="font-serif text-2xl font-bold text-forest-900 mb-1">{t.auth.register_title}</h1>
            <p className="text-sm text-gray-400 mb-8">{t.auth.register_subtitle}</p>

            {/* Google SSO */}
            <button onClick={handleGoogle} disabled={googleLoading || loading} className="btn-sso mb-6">
              {googleLoading
                ? <span className="w-5 h-5 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin flex-shrink-0" />
                : <GoogleIcon />}
              <span>{locale === "zh" ? "使用 Google 账号注册" : "Sign up with Google"}</span>
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cream-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs text-gray-400">
                  {locale === "zh" ? "或使用邮箱注册" : "or register with email"}
                </span>
              </div>
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.auth.name}</label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  <input type="text" required value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder={locale === "zh" ? "你的昵称" : "Display name"}
                    className="input pl-10" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.auth.email}</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  <input type="email" required value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="input pl-10" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.auth.password}</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  <input type={showPw ? "text" : "password"} required value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder={locale === "zh" ? "至少 8 位" : "At least 8 characters"}
                    className="input pl-10 pr-11" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPw ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.auth.confirm_password}</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  <input type={showPw ? "text" : "password"} required value={form.confirm}
                    onChange={e => setForm({ ...form, confirm: e.target.value })}
                    placeholder="••••••••"
                    className={`input pl-10 ${form.confirm && !pwMatch ? "border-red-300 focus:ring-red-400" : ""}`} />
                </div>
                {form.confirm && !pwMatch && (
                  <p className="text-xs text-red-400 mt-1">{locale === "zh" ? "密码不一致" : "Passwords don't match"}</p>
                )}
              </div>

              <button type="submit" disabled={loading || googleLoading || !pwMatch}
                className="w-full btn-brand py-3.5 rounded-xl text-sm mt-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100">
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <>{t.auth.register_btn} <FiArrowRight /></>}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              {t.auth.has_account}{" "}
              <Link href="/login" className="text-brand-500 font-semibold hover:text-brand-600 transition-colors">
                {t.auth.go_login}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
