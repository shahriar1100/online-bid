import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";

import { verifyJWT } from "../../util/jwt";
import { users } from "../../db/schema";

interface Env {
    DB: D1Database;
    JWT_SECRET: string;
}

export async function authenticateRequest(
    req: Request,
    env: Env
) {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.replace("Bearer ", "");

    const payload = await verifyJWT(token, env.JWT_SECRET);

    if (!payload) {
        return null;
    }

    const userId = Number(payload.userId);

    if (!userId) {
        return null;
    }

    const db = drizzle(env.DB);

    const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .get();

    return user ?? null;
}