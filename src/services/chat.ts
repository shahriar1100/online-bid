const API = process.env.NEXT_PUBLIC_WRANGLER_API_URL!;

export interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  receiverId: number;
  message: string;
  messageType: string;
  createdAt: number;
}

export interface ChatRoom {
  id: number;
  listingId: number;
  listingType: string;
  buyerId: number;
  sellerId: number;
}

export interface GetRoomsResponse {
  success: boolean;
  rooms: ChatRoom[];
}

export interface GetMessagesResponse {
  success: boolean;
  messages: ChatMessage[];
}

export interface SendMessageResponse {
  success: boolean;
}

export async function getRooms(): Promise<GetRoomsResponse> {
  const token = localStorage.getItem("authToken") || "";
  console.log("ROOM TOKEN =", token);

  const res = await fetch(`${API}/api/chat/rooms`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log("ROOM STATUS =", res.status);

  return (await res.json()) as GetRoomsResponse;
}

export async function getMessages(
  roomId: number
): Promise<GetMessagesResponse> {
  const token = localStorage.getItem("authToken") || "";

  console.log("TOKEN =", token);

  const res = await fetch(`${API}/api/chat/messages?roomId=${roomId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("STATUS =", res.status);

  const data = await res.json();

  console.log("RESPONSE =", data);

  return data as GetMessagesResponse;
}

export async function sendMessage(
  body: {
    roomId: number;
    receiverId: number;
    message: string;
  }
): Promise<SendMessageResponse> {
  const token = localStorage.getItem("authToken") || "";

  const res = await fetch(`${API}/api/chat/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  return (await res.json()) as SendMessageResponse;
}