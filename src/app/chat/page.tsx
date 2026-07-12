"use client";

import { useEffect, useState } from "react";
import { getRooms } from "src/services/chat";

import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import EmptyChat from "../../components/chat/EmptyChat";

export default function ChatPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);

  useEffect(() => {
    async function loadRooms() {
      try {
        const data = await getRooms();

        if (data.success) {
          setRooms(data.rooms);

          // প্রথম রুম অটো সিলেক্ট
          if (data.rooms.length > 0) {
            setSelectedRoom(data.rooms[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadRooms();
  }, []);

  return (
    <main className="h-[calc(100vh-80px)] bg-gray-100">
      <div className="mx-auto flex h-full max-w-7xl overflow-hidden rounded-xl border bg-white shadow-lg">

        <aside className="w-full border-r md:w-80 lg:w-96">
          <ChatSidebar
            rooms={rooms}
            loading={loading}
            selectedRoom={selectedRoom}
            onSelectRoom={setSelectedRoom}
          />
        </aside>

        <section className="hidden flex-1 md:flex">
          {selectedRoom ? (
            <ChatWindow room={selectedRoom} />
          ) : (
            <EmptyChat />
          )}
        </section>

      </div>
    </main>
  );
}