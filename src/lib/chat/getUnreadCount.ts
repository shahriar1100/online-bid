import { drizzle } from "drizzle-orm/d1";
import { and, eq, count } from "drizzle-orm";
import { chatMessages } from "../../db/model/chat-message";
import { authenticateRequest } from "../auth/authenticateRequest";

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods":
      "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",
  };
}

export async function getUnreadCount(
  req: Request,
  env: Env
): Promise<Response> {
  const auth = await authenticateRequest(req, env);

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

  const db = drizzle(env.DB);

  const result = await db
    .select({
      count: count(),
    })
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.receiverId, auth.id),
        eq(chatMessages.isRead, false),
        eq(chatMessages.isDeleted, false)
      )
    );

  return new Response(
    JSON.stringify({
      success: true,
      count: result[0]?.count ?? 0,
    }),
    {
      headers: {
        ...getCorsHeaders(),
        "Content-Type": "application/json",
      },
    }
  );
}