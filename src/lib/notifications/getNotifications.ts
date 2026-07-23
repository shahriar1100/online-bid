import { drizzle } from "drizzle-orm/d1";
import { desc, eq } from "drizzle-orm";
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


export async function getNotifications(
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
        const rows = await db
            .select()
            .from(notifications)
            .where(eq(notifications.user_id, auth.id))
            .orderBy(desc(notifications.created_at))
            .limit(20);

        return new Response(
            JSON.stringify({
                success: true,
                notifications: rows,
            }),
            {
                headers: {
                    ...getCorsHeaders(),
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (error) {
        console.error("Get notifications error:", error);

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