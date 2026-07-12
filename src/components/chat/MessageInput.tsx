"use client";

interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
}

export default function MessageInput({
  value,
  onChange,
  onSend,
}: MessageInputProps) {
  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Type your message..."
          value={value}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSend();
            }
          }}
          className="flex-1 rounded-full border border-gray-300 px-5 py-3 outline-none transition focus:border-blue-500"
        />

        <button
          onClick={onSend}
          className="rounded-full bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
