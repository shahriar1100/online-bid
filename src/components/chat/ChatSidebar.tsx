"use client";

import { useState } from "react";
import ChatRoomCard from "./ChatRoomCard";

interface Room {
  id: number;
  buyerId: number;
  sellerId: number;
  listingId: number;
  listingType: string;
  lastMessageAt: number;
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
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-xl font-bold">Messages</h2>
        <p className="text-sm text-gray-500">
          {rooms.length} conversation{rooms.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      <div className="border-b p-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
        />
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No conversations found
          </div>
        ) : (
          filteredRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onSelectRoom(room)}
              className={`cursor-pointer transition ${
                selectedRoom?.id === room.id
                  ? "bg-blue-50"
                  : "hover:bg-gray-100"
              }`}
            >
              <ChatRoomCard
                name={`${room.listingType.toUpperCase()} #${room.listingId}`}
                lastMessage="Open conversation"
                time={new Date(room.lastMessageAt).toLocaleDateString()}
                unread={0}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
