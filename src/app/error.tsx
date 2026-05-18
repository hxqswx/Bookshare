"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">😵</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">出错了 / Something went wrong</h2>
        <p className="text-gray-500 mb-8 text-sm">
          页面加载时发生错误，请重试。
          <br />
          An error occurred while loading this page.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
          >
            重试 / Retry
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            回首页 / Home
          </Link>
        </div>
      </div>
    </div>
  );
}
