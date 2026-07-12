"use client";

type ChatHeaderProps = {
  name: string;
  online?: boolean;
};

export default function ChatHeader({
  name,
  online = false,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b bg-white px-5 py-4">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
          {name.charAt(0).toUpperCase()}
        </div>

        {/* User Info */}
        <div>
          <h3 className="font-semibold text-gray-900">
            {name}
          </h3>

          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                online ? "bg-green-500" : "bg-gray-400"
              }`}
            />

            <span className="text-xs text-gray-500">
              {online ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <button className="rounded-lg p-2 transition hover:bg-gray-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 5h.01M12 12h.01M12 19h.01"
          />
        </svg>
      </button>
    </div>
  );
}