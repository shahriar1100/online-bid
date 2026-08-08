import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
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

export async function markAllNotificationsAsRead(
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
    await db
      .update(notifications)
      .set({
        is_read: true,
      })
      .where(eq(notifications.user_id, auth.id));

    console.log(
      "✅ All notifications marked as read for user:",
      auth.id
    );

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        headers: {
          ...getCorsHeaders(),
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "Mark all notifications as read error:",
      error
    );

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