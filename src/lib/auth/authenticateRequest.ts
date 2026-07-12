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

    console.log("AUTH HEADER =", authHeader);

    if (!authHeader?.startsWith("Bearer ")) {

        console.log("No Bearer token");
        return null;
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("TOKEN =", token);
    console.log("JWT SECRET =", env.JWT_SECRET);
console.log("JWT SECRET LENGTH =", env.JWT_SECRET?.length);

    const payload = await verifyJWT(token, env.JWT_SECRET);
    console.log("PAYLOAD =", payload);

    if (!payload) {
        console.log("JWT verify failed");
        return null;
    }

    const userId = Number(payload.userId);
    console.log("USER ID =", userId);

    if (!userId) {
        return null;
    }

    const db = drizzle(env.DB);

    const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .get();
        console.log("USER =", user);

    return user ?? null;
}