"use client";

import { useState } from "react";
import ChatRoomCard from "./ChatRoomCard";

// interface Room {
//   id: number;
//   buyerId: number;
//   sellerId: number;
//   listingId: number;
//   listingType: string;
//   lastMessageAt: number;
// }

interface Room {
  id: number;
  buyerId: number;
  sellerId: number;
  listingId: number;
  listingType: string;

  lastMessageAt: number;
  lastMessage: string;

  otherUserName: string;
  unread: number;
}

interface Props {
  rooms: Room[];
  loading: boolean;
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
}

export default function ChatSidebar({
  rooms,
  loading,
  selectedRoom,
  onSelectRoom,
}: Props) {
  const [search, setSearch] = useState("");

  const filteredRooms = (rooms ?? []).filter((room) =>
    `${room.listingType} ${room.listingId}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#1b1b1f]">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-zinc-700 p-4">
       <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {rooms.length} conversation{rooms.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      <div className="border-b border-gray-200 dark:border-zinc-700 p-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 py-2 text-sm outline-none focus:border-blue-500"
        />
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-zinc-400">Loading...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-6 text-center text-zinc-400">
            No conversations found
          </div>
        ) : (
          filteredRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onSelectRoom(room)}
              className={`cursor-pointer transition ${
                selectedRoom?.id === room.id
                  ? "bg-zinc-800"
                  : "hover:bg-zinc-800/70"
              }`}
            >
              <ChatRoomCard
                name={room.otherUserName}
                lastMessage={room.lastMessage}
                time={
                  room.lastMessageAt
                    ? new Date(room.lastMessageAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""
                }
                unread={room.unread}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
