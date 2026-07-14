"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";


export default function FloatingChatButton() {
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);

  // Temporary unread count
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
  loadUnreadCount();

  const interval = setInterval(loadUnreadCount, 5000);

  return () => clearInterval(interval);
}, []);

  if (!mounted) return null;

  // Hide on chat page
  if (pathname.startsWith("/chat")) return null;

  return (
    <Link
      href="/chat"
      className="
        fixed
        bottom-5
        right-5
        md:bottom-6
        md:right-6
        z-[99999]
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
        animate-pulse
      "
      style={{
        position: "fixed",
        right: "24px",
        bottom: "24px",
      }}
    >
      <MessageCircle size={30} strokeWidth={2.5} />

      {/* Online indicator */}
      <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white bg-green-400" />

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow-lg">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}