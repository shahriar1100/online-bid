import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";

import { chatRooms } from "../../db/model/chat-room";
import { chatMessages } from "../../db/model/chat-message";

interface Env {
  DB: D1Database;
}

export async function sendMessage(
  req: Request,
  env: Env
): Promise<Response> {
  const db = drizzle(env.DB);

  try {
    const body = await req.json() as {
      roomId: number;
      senderId: number;
      receiverId: number;
      message: string;
    };

    if (
      !body.roomId ||
      !body.senderId ||
      !body.receiverId ||
      !body.message?.trim()
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const room = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.id, body.roomId))
      .get();

    if (!room) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Room not found",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const [newMessage] = await db
      .insert(chatMessages)
      .values({
        roomId: body.roomId,
        senderId: body.senderId,
        receiverId: body.receiverId,
        message: body.message,
        messageType: "text",
      })
      .returning();

    await db
      .update(chatRooms)
      .set({
        lastMessageAt: Date.now(),
      })
      .where(eq(chatRooms.id, body.roomId));

    return new Response(
      JSON.stringify({
        success: true,
        message: newMessage,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);

    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}