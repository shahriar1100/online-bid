"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function FloatingChatButton() {
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/chat/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setUnreadCount(data.count);
      }
    } catch (err) {
      console.error("Unread count error:", err);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    loadUnreadCount();

    const interval = setInterval(loadUnreadCount, 5000);

    return () => clearInterval(interval);
  }, [mounted]);

  // Don't render before client mount
  if (!mounted) return null;

  // Don't show on chat page
  if (pathname.startsWith("/chat")) return null;

  const button = (
    <Link
      href="/chat"
      onClick={(e) => {
        e.stopPropagation();
      }}
      aria-label="Open chat"
      className="
        pointer-events-auto
        fixed
        right-6
        bottom-6
        flex
        h-16
        w-16
        items-center
        justify-center
        rounded-full
        bg-[#25D366]
        text-white
        shadow-2xl
        transition-all
        duration-300
        hover:scale-110
        active:scale-95
      "
      style={{
        position: "fixed",
        right: "24px",
        bottom: "24px",
        zIndex: 2147483647,
        pointerEvents: "auto",
      }}
    >
      <MessageCircle
        size={30}
        strokeWidth={2.5}
      />

      {/* Online indicator */}
      <span
        className="
          absolute
          bottom-1
          right-1
          h-3
          w-3
          rounded-full
          border-2
          border-white
          bg-green-400
        "
      />

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span
          className="
            absolute
            -right-1
            -top-1
            flex
            h-6
            min-w-6
            items-center
            justify-center
            rounded-full
            bg-red-600
            px-1
            text-[11px]
            font-bold
            text-white
            shadow-lg
          "
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );

  // Render directly under <body>
  return createPortal(button, document.body);
}