"use client";

type ChatHeaderProps = {
  name: string;
  online?: boolean;
  onBack?: () => void;
};

export default function ChatHeader({
  name,
  online = false,
  onBack,
}: ChatHeaderProps) {
  return (
  <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-[#1b1b1f] px-5 py-4">
    <div className="flex items-center gap-3">

      {/* Mobile Back Button */}
      <button
        onClick={onBack}
        className="mr-1 flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 md:hidden"
      >
        ←
      </button>

      {/* Avatar */}
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
        {name.charAt(0).toUpperCase()}
      </div>

      {/* User Info */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {name}
        </h3>

        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              online ? "bg-green-500" : "bg-gray-400"
            }`}
          />

          <span className="text-xs text-gray-500 dark:text-gray-400">
            {online ? "Online" : "Offline"}
          </span>
        </div>
      </div>
    </div>

    {/* Menu */}
    <button className="rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
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