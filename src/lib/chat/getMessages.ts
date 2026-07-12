import { drizzle } from "drizzle-orm/d1";
import { eq, asc } from "drizzle-orm";
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

export async function getMessages(
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
                }
            }
        );
    }

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
                        ...getCorsHeaders(),
                        "Content-Type": "application/json",
                    }
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
                    ...getCorsHeaders(),
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
                    ...getCorsHeaders(),
                    "Content-Type": "application/json",
                }
            }
        );
    }
}