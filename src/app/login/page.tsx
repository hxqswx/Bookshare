"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiEye, FiEyeOff, FiBook } from "react-icons/fi";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.ok) {
      toast.success(locale === "zh" ? "登录成功！" : "Logged in successfully!");
      router.push("/");
      router.refresh();
    } else {
      toast.error(locale === "zh" ? "邮箱或密码错误" : "Invalid email or password");
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setForm({ email: "alice@bookshare.com", password: "demo123456" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent-200/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl shadow-lg mb-4">
              <FiBook className="text-white text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{t.auth.login_title}</h1>
            <p className="text-gray-500 text-sm mt-1">{t.auth.login_subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.auth.email}
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.auth.password}
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all text-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading
                ? locale === "zh" ? "登录中..." : "Logging in..."
                : t.auth.login_btn}
            </button>
          </form>

          {/* Demo account */}
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400">
                <span className="bg-white px-3">{t.auth.or}</span>
              </div>
            </div>
            <button
              onClick={fillDemo}
              className="mt-4 w-full py-3 border-2 border-dashed border-primary-200 text-primary-600 rounded-xl text-sm font-medium hover:bg-primary-50 transition-colors"
            >
              🎭 {locale === "zh" ? "使用体验账号登录" : "Try Demo Account"}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t.auth.no_account}{" "}
            <Link
              href="/register"
              className="text-primary-600 font-semibold hover:text-primary-700"
            >
              {t.auth.go_register}
            </Link>
          </p>
        </div>

        {/* Decorative book emoji */}
        <div className="absolute -top-6 -right-6 text-4xl animate-float pointer-events-none">
          📚
        </div>
        <div className="absolute -bottom-4 -left-4 text-3xl animate-float pointer-events-none" style={{ animationDelay: "1s" }}>
          ✨
        </div>
      </motion.div>
    </div>
  );
}
