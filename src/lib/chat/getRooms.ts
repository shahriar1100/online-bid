import { drizzle } from "drizzle-orm/d1";
import { eq, or } from "drizzle-orm";
import { chatRooms } from "../../db/model/chat-room";


interface Env {
  DB: D1Database;
}

export async function getRooms(
  req: Request,
  env: Env
): Promise<Response> {
  const db = drizzle(env.DB);

  try {
    const url = new URL(req.url);

    const userId = Number(url.searchParams.get("userId"));

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing userId",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const rooms = await db
      .select()
      .from(chatRooms)
      .where(
        or(
          eq(chatRooms.buyerId, userId),
          eq(chatRooms.sellerId, userId)
        )
      );

    return new Response(
      JSON.stringify({
        success: true,
        rooms,
      }),
      {
        headers: {
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
          "Content-Type": "application/json",
        },
      }
    );
  }
}