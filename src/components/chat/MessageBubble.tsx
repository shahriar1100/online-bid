"use client";

interface MessageBubbleProps {
  message: string;
  isOwnMessage?: boolean;
  time?: string;
}

export default function MessageBubble({
  message,
  isOwnMessage = false,
  time,
}: MessageBubbleProps) {
  return (
    <div
      className={`mb-4 flex ${
        isOwnMessage ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow ${
          isOwnMessage
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-900 border border-gray-200"
        }`}
      >
        <p className="text-sm break-words">
          {message}
        </p>

        {time ? (
          <p
            className={`mt-2 text-xs text-right ${
              isOwnMessage
                ? "text-blue-100"
                : "text-gray-500"
            }`}
          >
            {time}
          </p>
        ) : null}
      </div>
    </div>
  );
}