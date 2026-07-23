import { drizzle } from "drizzle-orm/d1";
import { and, count, eq } from "drizzle-orm";
import { notifications } from "../../db/model/notification";
import { authenticateRequest } from "../auth/authenticateRequest";

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods":
      "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",
  };
}

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export async function getUnreadCount(
  req: Request,
  env: Env
): Promise<Response> {
  const db = drizzle(env.DB);

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

  try {
    const [result] = await db
      .select({
        count: count(),
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.user_id, auth.id),
          eq(notifications.is_read, false)
        )
      );

    return new Response(
      JSON.stringify({
        success: true,
        count: result?.count ?? 0,
      }),
      {
        headers: {
  ...getCorsHeaders(),
  "Content-Type": "application/json",
},
      }
    );
  } catch (error) {
    console.error("Get unread notification count error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal Server Error",
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