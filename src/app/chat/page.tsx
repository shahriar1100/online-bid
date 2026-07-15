"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getRooms } from "src/services/chat";
import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import EmptyChat from "../../components/chat/EmptyChat";
import Navbar from "src/components/header";

export const dynamic = "force-dynamic";

function ChatContent() {
  const searchParams = useSearchParams();
  const roomId = Number(searchParams.get("roomId"));

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);

  async function loadRooms() {
    try {
      const data = await getRooms();

      if (data.success) {
        setRooms(data.rooms);

        setSelectedRoom((prev: any) => {
          if (roomId) {
            const target = data.rooms.find((room: any) => room.id === roomId);
            if (target) return target;
          }

          if (prev) {
            const updated = data.rooms.find((room: any) => room.id === prev.id);
            if (updated) return updated;
          }

          return data.rooms[0] ?? null;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRooms();
  }, [roomId]);

  return (
    <>
      <Navbar />

      <main className="pt-20 md:pt-24 bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="h-[calc(100vh-110px)] md:h-[calc(100vh-170px)] overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex h-full">
              <aside
                className={`${
                  selectedRoom ? "hidden md:block" : "block"
                } w-full md:w-[340px] border-r border-border`}
              >
                <ChatSidebar
                  rooms={rooms}
                  loading={loading}
                  selectedRoom={selectedRoom}
                  onSelectRoom={setSelectedRoom}
                />
              </aside>

              <section
                className={`${
                  selectedRoom ? "flex" : "hidden md:flex"
                } min-h-0 flex-1`}
              >
                {selectedRoom ? (
                  <ChatWindow
                    room={selectedRoom}
                    onMessageSent={loadRooms}
                    onBack={() => setSelectedRoom(null)}
                  />
                ) : (
                  <EmptyChat />
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}
