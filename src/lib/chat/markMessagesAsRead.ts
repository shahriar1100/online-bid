import { drizzle } from "drizzle-orm/d1";
import { and, eq } from "drizzle-orm";
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

export async function markMessagesAsRead(
    req: Request,
    env: Env
): Promise<Response> {
    console.log("========== MARK READ API HIT ==========");

    const auth = await authenticateRequest(req, env);

    if (!auth) {
        console.log("AUTH FAILED");

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
        const { roomId } = (await req.json()) as {
            roomId: number;
        };

        console.log("ROOM ID =", roomId);
        console.log("AUTH ID =", auth.id);

        const db = drizzle(env.DB);

        const before = await db
            .select()
            .from(chatMessages)
            .where(
                and(
                    eq(chatMessages.roomId, roomId),
                    eq(chatMessages.receiverId, auth.id),
                    eq(chatMessages.isRead, false)
                )
            );

        console.log("UNREAD BEFORE UPDATE =", before);

        const result = await db
            .update(chatMessages)
            .set({
                isRead: true,
                seenAt: Date.now(),
            })
            .where(
                and(
                    eq(chatMessages.roomId, roomId),
                    eq(chatMessages.receiverId, auth.id),
                    eq(chatMessages.isRead, false)
                )
            );

        console.log("MARK READ RESULT =", result);

        const after = await db
            .select()
            .from(chatMessages)
            .where(eq(chatMessages.roomId, roomId));

        console.log(
            "MESSAGES AFTER UPDATE =",
            after.map((m) => ({
                id: m.id,
                senderId: m.senderId,
                receiverId: m.receiverId,
                isRead: m.isRead,
                seenAt: m.seenAt,
            }))
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
    } catch (err) {
        console.error("MARK READ ERROR =", err);

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
                },
            }
        );
    }
}