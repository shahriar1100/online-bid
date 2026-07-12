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
    <div className="border-t bg-white p-4">
      <div className="flex items-center gap-3">
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
          className="flex-1 rounded-full border border-gray-300 bg-white px-5 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500"
        />

        <button
          onClick={onSend}
          disabled={sending}
          className="flex w-28 items-center justify-center rounded-full bg-blue-600 py-3 font-medium text-white transition disabled:opacity-70"
        >
          {sending && (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          Send
        </button>
      </div>
    </div>
  );
}
