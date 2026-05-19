"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { FiMail, FiRefreshCw, FiArrowLeft, FiCheck } from "react-icons/fi";

function CheckEmailContent() {
  const { locale } = useLanguage();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState("");

  const handleResend = async () => {
    if (resending || resent) return;
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
        setResendError(data.error ?? (locale === "zh" ? "发送失败，请稍后重试" : "Failed to send, please try again"));
      } else {
        setResent(true);
      }
    } catch {
      setResendError(locale === "zh" ? "网络错误，请重试" : "Network error, please try again");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-gradient flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl border border-cream-200 shadow-card p-10 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiMail className="text-brand-500 text-4xl" />
          </div>

          <h1 className="font-serif text-2xl font-bold text-forest-900 mb-3">
            {locale === "zh" ? "验证邮件已发送" : "Check your inbox"}
          </h1>

          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            {locale === "zh"
              ? "我们已向以下邮箱发送了验证链接："
              : "We've sent a verification link to:"}
          </p>

          {email && (
            <div className="inline-block bg-forest-50 text-forest-700 font-semibold text-sm px-4 py-2 rounded-xl mb-6">
              {email}
            </div>
          )}

          <p className="text-gray-400 text-xs leading-relaxed mb-8">
            {locale === "zh"
              ? "请点击邮件中的验证按钮完成注册。链接将在 24 小时后失效。如未收到，请查看垃圾邮件文件夹。"
              : "Click the verification button in the email to complete registration. The link expires in 24 hours. If you don't see it, check your spam folder."}
          </p>

          {/* Resend button */}
          {resent ? (
            <div className="flex items-center justify-center gap-2 text-forest-600 text-sm font-medium mb-6">
              <FiCheck />
              {locale === "zh" ? "验证邮件已重新发送！" : "Verification email resent!"}
            </div>
          ) : (
            <div className="mb-6">
              <button
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-cream-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {resending
                  ? <span className="w-4 h-4 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                  : <FiRefreshCw className="text-sm" />}
                {locale === "zh" ? "重新发送验证邮件" : "Resend verification email"}
              </button>
              {resendError && (
                <p className="text-red-500 text-xs mt-2">{resendError}</p>
              )}
            </div>
          )}

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-forest-600 transition-colors"
          >
            <FiArrowLeft size={12} />
            {locale === "zh" ? "返回登录页" : "Back to login"}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  );
}
