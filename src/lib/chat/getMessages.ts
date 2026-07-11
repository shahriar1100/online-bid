import { drizzle } from "drizzle-orm/d1";
import { eq, asc } from "drizzle-orm";
import { chatMessages } from "../../db/model/chat-message";

interface Env {
  DB: D1Database;
}

export async function getMessages(
  req: Request,
  env: Env
): Promise<Response> {
  const db = drizzle(env.DB);

  try {
    const url = new URL(req.url);
    const roomId = Number(url.searchParams.get("roomId"));

    if (!roomId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing roomId",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(asc(chatMessages.createdAt));

    return new Response(
      JSON.stringify({
        success: true,
        messages,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

  } catch (err) {
    console.error("GET MESSAGES ERROR:", err);

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