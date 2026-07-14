"use client";

import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

import { getMessages, ChatMessage, sendMessage } from "src/services/chat";

// interface Room {
//   id: number;
//   listingId: number;
//   listingType: string;
//   buyerId: number;
//   sellerId: number;
// }

interface Room {
  id: number;
  listingId: number;
  listingType: string;
  buyerId: number;
  sellerId: number;

  otherUserName: string;
  lastMessage: string;
  lastMessageAt: number;
  unread: number;
}

// interface Props {
//   room: Room;
// }
interface Props {
  room: Room;
  onMessageSent: () => Promise<void>;
  onBack: () => void;
}

export default function ChatWindow({ room, onMessageSent, onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function markRead() {
    await fetch(
      `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/chat/mark-read`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
        body: JSON.stringify({
          roomId: room.id,
        }),
      },
    );
  }

  async function loadMessages() {
    try {
      const data = await getMessages(room.id);

      if (data.success) {
        setMessages(data.messages);

        await markRead();
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);

      await loadMessages();

      setLoading(false);
    }

    init();

    const interval = setInterval(() => {
      loadMessages();
    }, 2000);

    return () => clearInterval(interval);
  }, [room.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSend() {
    if (!text.trim() || sending) return;

    setSending(true);

    try {
      const receiverId =
        user.id === room.buyerId ? room.sellerId : room.buyerId;

      const res = await sendMessage({
        roomId: room.id,
        receiverId,
        message: text,
      });

      if (res.success) {
        setText("");

        const data = await getMessages(room.id);

        if (data.success) {
          setMessages(data.messages);
          await loadMessages();
          await onMessageSent();
        }
      }
    } finally {
      setSending(false);
    }
  }

  console.log("MESSAGES STATE =", messages);
  return (
    <div className="flex h-full w-full flex-col bg-background">
      <ChatHeader name={room.otherUserName} online={true} onBack={onBack} />

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-[#18181b] px-3 py-4 md:px-6 md:py-6">
        {loading ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            No messages yet
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg.message ?? ""}
              isOwnMessage={msg.senderId === user.id}
              isRead={msg.isRead}
              seenAt={msg.seenAt} // 👈 এটা add করো
              time={new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput
        value={text}
        onChange={(e) => setText(e.target.value)}
        onSend={handleSend}
        sending={sending}
      />
    </div>
  );
}
