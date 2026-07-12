import { drizzle } from "drizzle-orm/d1";
import { eq, or } from "drizzle-orm";
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