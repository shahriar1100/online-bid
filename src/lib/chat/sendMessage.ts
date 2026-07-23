import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";

import { chatRooms } from "../../db/model/chat-room";
import { chatMessages } from "../../db/model/chat-message";
import { authenticateRequest } from "../auth/authenticateRequest";
import { createNotificationRecord } from "../notifications/createNotification";


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


export async function sendMessage(
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
        const body = await req.json() as {
            roomId: number;
            receiverId: number;
            message: string;
        };

        if (
            !body.roomId ||
            !body.receiverId ||
            !body.message?.trim()
        ) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Missing required fields",
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

        const room = await db
            .select()
            .from(chatRooms)
            .where(eq(chatRooms.id, body.roomId))
            .get();

        if (!room) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Room not found",
                }),
                {
                    status: 404,
                    headers: {
                        ...getCorsHeaders(),
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        if (!room.paymentCompleted || room.roomStatus !== "active") {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Chat is locked until payment is completed.",
                }),
                {
                    status: 403,
                    headers: {
                        ...getCorsHeaders(),
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        if (room.roomStatus !== "active" || (room.paymentRequired && !room.paymentCompleted)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Chat is locked. Complete the platform payment first.",
                }),
                {
                    status: 403,
                    headers: {
                        ...getCorsHeaders(),
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const [newMessage] = await db
            .insert(chatMessages)
            .values({
                roomId: body.roomId,
                senderId: auth.id,
                receiverId: body.receiverId,
                message: body.message,
                messageType: "text",
            })
            .returning();

        await createNotificationRecord(db, {
            userId: body.receiverId,
            listingId: room.listingId,
            type: "message",
            title: "You have received a new message.",
            link: `/chat?roomId=${body.roomId}`,
        });

        await db
            .update(chatRooms)
            .set({
                lastMessageAt: Date.now(),
            })
            .where(eq(chatRooms.id, body.roomId));

        return new Response(
            JSON.stringify({
                success: true,
                message: newMessage,
            }),
            {
                headers: {
                    ...getCorsHeaders(),
                    "Content-Type": "application/json",
                },
            }
        );

    } catch (err) {
        console.error("SEND MESSAGE ERROR:", err);

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