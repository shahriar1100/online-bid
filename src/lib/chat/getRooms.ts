import { drizzle } from "drizzle-orm/d1";
import { eq, or, and, desc } from "drizzle-orm";
import { chatRooms } from "../../db/model/chat-room";
import { authenticateRequest } from "../auth/authenticateRequest";

import { chatMessages } from "../../db/model/chat-message";
import { users } from "../../db/schema";



interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function getRooms(
  req: Request,
  env: Env
): Promise<Response> {
  const db = drizzle(env.DB);

  try {
    const auth = await authenticateRequest(req, env);
    console.log("AUTH =", auth);

    if (!auth) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: {
            ...getCorsHeaders(),
            "Content-Type": "application/json",
          },
        }
      );
    }

    const userId = auth.id;

const rooms = await db
  .select()
  .from(chatRooms)
  .where(
    and(
      or(
        eq(chatRooms.buyerId, userId),
        eq(chatRooms.sellerId, userId)
      ),
      eq(chatRooms.roomStatus, "active"),
      eq(chatRooms.paymentCompleted, true)
    )
  )
  .orderBy(desc(chatRooms.lastMessageAt));

      const roomsWithPreview = await Promise.all(
  rooms.map(async (room) => {
    const lastMessage = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.roomId, room.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1);

    const otherUserId =
      room.buyerId === userId ? room.sellerId : room.buyerId;

    const otherUser = await db
      .select({
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, otherUserId))
      .limit(1);

    return {
      ...room,
      lastMessage: lastMessage[0]?.message ?? "No messages yet",
      lastMessageAt:
        lastMessage[0]?.createdAt ?? room.lastMessageAt,
      otherUserName:
        otherUser[0]?.name ?? `User #${otherUserId}`,
      unread: 0,
    };
  })
);

    return new Response(
      JSON.stringify({
        success: true,
        rooms: roomsWithPreview,
      }),
      {
        status: 200,
        headers: {
          ...getCorsHeaders(),
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("GET ROOMS ERROR:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(),
          "Content-Type": "application/json",
        },
      }
    );
  }
}