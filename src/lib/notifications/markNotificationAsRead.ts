import { drizzle } from "drizzle-orm/d1";
import { and, eq } from "drizzle-orm";
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

export async function markNotificationAsRead(
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
    const body = (await req.json()) as {
      notificationId: number;
    };

    if (!body.notificationId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Notification ID is required",
        }),
        {
          status: 400,
          headers: {
  ...getCorsHeaders(),
  "Content-Type": "application/json",
},
        }
      );
    }

    await db
      .update(notifications)
      .set({
        is_read: true,
      })
      .where(
        and(
          eq(notifications.id, body.notificationId),
          eq(notifications.user_id, auth.id)
        )
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
    console.error("Mark notification as read error:", error);

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