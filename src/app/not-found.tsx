import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">📭</div>
        <h1 className="text-5xl font-extrabold text-gray-800 mb-3">404</h1>
        <h2 className="text-xl font-bold text-gray-600 mb-3">页面不存在 / Page Not Found</h2>
        <p className="text-gray-400 text-sm mb-8">
          你要找的页面已经飞走了～
          <br />
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
        >
          🏠 回首页 / Go Home
        </Link>
      </div>
    </div>
  );
}
