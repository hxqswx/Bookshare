"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { FiCheckCircle, FiAlertCircle, FiArrowRight, FiRefreshCw, FiCheck } from "react-icons/fi";

function VerifyEmailContent() {
  const { locale } = useLanguage();
  const searchParams = useSearchParams();
  const status = searchParams.get("status"); // "success" | "expired" | "invalid" | "error"
  const email = searchParams.get("email") ?? "";

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState("");

  const handleResend = async () => {
    if (!email || resending || resent) return;
    setResending(true);
    setResendError("");
    try {
      const res = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setResendError(data.error ?? (locale === "zh" ? "发送失败" : "Failed to send"));
      } else {
        setResent(true);
      }
    } catch {
      setResendError(locale === "zh" ? "网络错误" : "Network error");
    } finally {
      setResending(false);
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-warm-gradient flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl border border-cream-200 shadow-card p-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-forest-50 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <FiCheckCircle className="text-forest-500 text-4xl" />
            </motion.div>

            <h1 className="font-serif text-2xl font-bold text-forest-900 mb-3">
              {locale === "zh" ? "邮箱验证成功！" : "Email verified!"}
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              {locale === "zh"
                ? "您的邮箱已通过验证，现在可以登录并开始与书友们交流了。"
                : "Your email has been verified. You can now log in and start connecting with fellow readers."}
            </p>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold text-sm transition-all hover:-translate-y-0.5 shadow-brand"
            >
              {locale === "zh" ? "立即登录" : "Log in now"}
              <FiArrowRight />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Expired or invalid/error
  const isExpired = status === "expired";

  return (
    <div className="min-h-screen bg-warm-gradient flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl border border-cream-200 shadow-card p-10 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiAlertCircle className="text-red-400 text-4xl" />
          </div>

          <h1 className="font-serif text-2xl font-bold text-forest-900 mb-3">
            {locale === "zh"
              ? isExpired ? "验证链接已过期" : "验证链接无效"
              : isExpired ? "Link expired" : "Invalid link"}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            {locale === "zh"
              ? isExpired
                ? "该验证链接已超过 24 小时，请重新发送验证邮件。"
                : "该验证链接无效或已被使用。请重新发送验证邮件。"
              : isExpired
              ? "This verification link expired after 24 hours. Please request a new one."
              : "This link is invalid or has already been used. Please request a new one."}
          </p>

          {/* Resend section */}
          {resent ? (
            <div className="flex items-center justify-center gap-2 text-forest-600 text-sm font-semibold mb-6">
              <FiCheck />
              {locale === "zh" ? "新的验证邮件已发送！" : "New verification email sent!"}
            </div>
          ) : email ? (
            <div className="mb-6">
              <button
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {resending
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <FiRefreshCw className="text-sm" />}
                {locale === "zh" ? "重新发送验证邮件" : "Resend verification email"}
              </button>
              {resendError && (
                <p className="text-red-500 text-xs mt-2">{resendError}</p>
              )}
            </div>
          ) : (
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold text-sm transition-all mb-6"
            >
              {locale === "zh" ? "重新注册" : "Register again"}
            </Link>
          )}

          <div>
            <Link
              href="/login"
              className="text-xs text-gray-400 hover:text-forest-600 transition-colors"
            >
              {locale === "zh" ? "返回登录页" : "Back to login"}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
