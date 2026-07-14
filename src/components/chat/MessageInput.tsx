"use client";

interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  sending: boolean;
}

export default function MessageInput({
  value,
  onChange,
  onSend,
  sending,
}: MessageInputProps) {
  return (
    <div className="border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-[#202020] p-3 md:p-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Type your message..."
          value={value}
          onChange={onChange}
          disabled={sending}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSend();
            }
          }}
          className="min-w-0 flex-1 rounded-full border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 md:px-5 py-3 outline-none transition focus:border-blue-500"
        />

        <button
          onClick={onSend}
          disabled={sending}
          className="shrink-0 rounded-full bg-blue-600 px-4 md:px-7 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-70"
        >
          {sending && (
            <div className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          Send
        </button>
      </div>
    </div>
  );
}
