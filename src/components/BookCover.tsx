"use client";

import { useState } from "react";
import Image from "next/image";

interface BookCoverProps {
  src: string | null | undefined;
  alt: string;
  title: string;
  fill?: boolean;
  className?: string;
}

export function BookCover({ src, alt, title, fill = true, className = "object-cover" }: BookCoverProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(src || null);

  if (!imgSrc) {
    return <PlaceholderCover title={title} />;
  }

  // Use a plain <img> for all external URLs to avoid Next.js optimization proxy
  // being blocked by CDN hotlink protection (Douban, etc.) on mobile/tablet
  const isExternal = imgSrc.startsWith("http://") || imgSrc.startsWith("https://");

  if (isExternal) {
    if (fill) {
      return (
        <img
          src={imgSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full ${className}`}
          onError={() => setImgSrc(null)}
          loading="lazy"
        />
      );
    }
    return (
      <img
        src={imgSrc}
        alt={alt}
        className={className}
        onError={() => setImgSrc(null)}
        loading="lazy"
      />
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      className={className}
      onError={() => setImgSrc(null)}
    />
  );
}

function PlaceholderCover({ title }: { title: string }) {
  const colors = [
    ["#f19340", "#ee7519"],
    ["#d946ef", "#a21caf"],
    ["#22c55e", "#15803d"],
    ["#3b82f6", "#1d4ed8"],
    ["#f43f5e", "#be123c"],
  ];
  const idx = Math.abs(title.charCodeAt(0) + (title.charCodeAt(1) || 0)) % colors.length;
  const [from, to] = colors[idx];
  const short = title.slice(0, 2).toUpperCase();

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center text-white"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <div className="text-4xl font-extrabold opacity-90 mb-1">{short}</div>
      <div className="text-[9px] text-center px-2 opacity-70 line-clamp-2">{title}</div>
    </div>
  );
}
