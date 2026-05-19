import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-gradient px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6 animate-float">📭</div>
        <h1 className="font-serif text-6xl font-bold text-forest-900 mb-3">404</h1>
        <h2 className="text-xl font-semibold text-gray-600 mb-3">
          页面不见了 / Page Not Found
        </h2>
        <p className="text-gray-400 text-sm mb-10 leading-relaxed">
          你要找的页面已经飞走了～<br />
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/" className="btn-brand text-base px-8 py-3.5 rounded-2xl shadow-brand">
          🏠 回首页 / Go Home
        </Link>
      </div>
    </div>
  );
}
