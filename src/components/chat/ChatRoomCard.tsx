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
      className={`w-full flex items-center gap-3 p-4 border-b border-zinc-200 transition-all duration-200 text-left
        ${
          active
            ? "bg-blue-50 dark:bg-blue-950/40 border-l-4 border-l-blue-600"
            : "bg-white dark:bg-[#1b1b1f] hover:bg-gray-100 dark:hover:bg-zinc-800"
        }`}
    >
      {/* Avatar */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
        {name.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{name}</h3>

         <span className="text-xs text-gray-500 dark:text-gray-400">
            {time}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{lastMessage}</p>

          {unread > 0 && (
            <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-medium text-white">
              {unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
