"use client";

import { useEffect, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

import { getMessages, ChatMessage, sendMessage } from "src/services/chat";

interface Room {
  id: number;
  listingId: number;
  listingType: string;
  buyerId: number;
  sellerId: number;
}

interface Props {
  room: Room;
}

export default function ChatWindow({ room }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMessages() {
      setLoading(true);

      try {
        const data = await getMessages(room.id);

        if (data.success) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [room.id]);

  async function handleSend() {
    if (!text.trim()) return;

    const receiverId = user.id === room.buyerId ? room.sellerId : room.buyerId;

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
      }
    }
  }
  console.log("MESSAGES STATE =", messages);
  return (
    <div className="flex h-full flex-col bg-gray-100">
      <ChatHeader
        name={`${room.listingType.toUpperCase()} #${room.listingId}`}
        online={true}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-4 py-5">
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
              time={new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
          ))
        )}
      </div>

      <div className="border-t bg-white p-4">
        <MessageInput
          value={text}
          onChange={(e) => setText(e.target.value)}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
