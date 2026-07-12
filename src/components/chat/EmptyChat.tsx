export default function EmptyChat() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-50">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">💬</div>

        <h2 className="mb-2 text-2xl font-semibold text-gray-800">
          Welcome to Chat
        </h2>

        <p className="text-gray-500">
          Select a conversation from the left sidebar to start chatting with the
          buyer or seller.
        </p>
      </div>
    </div>
  );
}