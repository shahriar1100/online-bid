"use client";

interface MessageBubbleProps {
  message: string;
  isOwnMessage?: boolean;
  isRead?: boolean;
  seenAt?: number | null;
  time?: string;
}

export default function MessageBubble({
  message,
  isOwnMessage = false,
  isRead,
  seenAt,
  time,
}: MessageBubbleProps) {
  return (
    <div
      className={`mb-4 flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow ${
          isOwnMessage
            ? "bg-blue-600 text-white"
            : "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700"
        }`}
      >
        <p className="text-sm break-words">{message}</p>

        {time && (
          <p
            className={`mt-2 text-xs text-right ${
              isOwnMessage
                ? "text-blue-100"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {time}
          </p>
        )}

        {isOwnMessage && (
          <p
            className={`text-[11px] text-right ${
              isRead && seenAt ? "text-blue-200" : "text-gray-300"
            }`}
          >
            {isRead && seenAt ? "Seen" : "Delivered"}
          </p>
        )}
      </div>
    </div>
  );
}
