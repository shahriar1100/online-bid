"use client";

type ChatRoomCardProps = {
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
  active?: boolean;
  onClick?: () => void;
};

export default function ChatRoomCard({
  name,
  lastMessage,
  time,
  unread = 0,
  active = false,
  onClick,
}: ChatRoomCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 border-b transition-all duration-200 text-left
        ${
          active
            ? "bg-blue-50 border-l-4 border-l-blue-600"
            : "hover:bg-gray-100"
        }`}
    >
      {/* Avatar */}
      <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 truncate">
            {name}
          </h3>

          <span className="text-xs text-gray-500 whitespace-nowrap">
            {time}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-gray-500 truncate">
            {lastMessage}
          </p>

          {unread > 0 && (
            <span className="ml-2 h-5 min-w-5 px-1 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
              {unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}