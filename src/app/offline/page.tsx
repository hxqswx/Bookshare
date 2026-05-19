"use client";

/**
 * Offline fallback page — shown by the Service Worker when the user is
 * offline and the requested page is not cached.
 */
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-forest-50 border border-forest-100 flex items-center justify-center shadow-sm">
          <span className="text-5xl select-none">📚</span>
        </div>

        <h1 className="font-serif text-2xl font-bold text-forest-900 mb-2">
          暂时离线
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-1">
          You&apos;re currently offline
        </p>
        <p className="text-gray-400 text-xs leading-relaxed mb-8">
          检查网络连接后重试，已缓存的书单和内容仍可浏览。
          <br />
          Cached books and pages are still available below.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          🔄 重试 / Retry
        </button>

        <p className="mt-8 text-[11px] text-gray-300">
          我们真的爱读书 · PWA
        </p>
      </div>
    </div>
  );
}
