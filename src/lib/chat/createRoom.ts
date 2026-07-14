import { drizzle } from "drizzle-orm/d1";
import { and, eq } from "drizzle-orm";

import { chatRooms } from "../../db/model/chat-room";
import { users } from "../../db/schema";
import { chatParticipants } from "../../db/model/chat-participant";
import { authenticateRequest } from "../auth/authenticateRequest";


interface Env {
    DB: D1Database;
    JWT_SECRET: string;
}

export async function createChatRoom(
    db: ReturnType<typeof drizzle>,
    data: {
        listingId: number;
        listingType: "realestate" | "automobile" | "business";
        buyerId: number;
        sellerId: number;
    }
): Promise<typeof chatRooms.$inferSelect> {
    const { listingId, listingType, buyerId, sellerId } = data;

    const existingRoom = await db
        .select()
        .from(chatRooms)
        .where(
            and(
                eq(chatRooms.listingId, listingId),
                eq(chatRooms.listingType, listingType),
                eq(chatRooms.buyerId, buyerId),
                eq(chatRooms.sellerId, sellerId)
            )
        )
        .get();

    if (existingRoom) {
        return existingRoom;
    }

    const [newRoom] = await db
        .insert(chatRooms)
        .values({
            listingId,
            listingType,
            buyerId,
            sellerId,
            paymentRequired: true,
            paymentCompleted: false,
            roomStatus: "pending",
            lastMessageAt: Date.now(),
        })
        .returning();

    console.log("Creating buyer participant...");

    try {

        await db.insert(chatParticipants).values({
            roomId: newRoom.id,
            userId: buyerId,
            role: "buyer",
        });

        console.log("Buyer inserted");

        console.log("Creating seller participant...");

        await db.insert(chatParticipants).values({
            roomId: newRoom.id,
            userId: sellerId,
            role: "seller",
        });

        console.log("Seller inserted");

        console.log("Participants created successfully");

    } catch (err) {

        console.error("Participant insert failed:", err);

    }

    return newRoom;
}

export async function createRoom(
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
                    "Content-Type": "application/json",
                },
            }
        );
    }

    try {
        const body = await req.json() as {
            listingId: number;
            listingType: "realestate" | "automobile" | "business";
            sellerId: number;
        };

        const { listingId, listingType, sellerId } = body;
        const buyerId = auth.id;

        if (!listingId || !listingType || !sellerId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Missing required fields",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const buyer = await db
            .select()
            .from(users)
            .where(eq(users.id, buyerId))
            .get();

        if (!buyer) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Buyer not found",
                }),
                {
                    status: 404,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const seller = await db
            .select()
            .from(users)
            .where(eq(users.id, sellerId))
            .get();

        if (!seller) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Seller not found",
                }),
                {
                    status: 404,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const room = await createChatRoom(db, {
            listingId,
            listingType,
            buyerId,
            sellerId,
        });

        return new Response(
            JSON.stringify({
                success: true,
                roomId: room.id,
                room,
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

    } catch (error) {
        console.error("Create room error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: "Internal Server Error",
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