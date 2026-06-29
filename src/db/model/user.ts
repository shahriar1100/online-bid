import { users } from "../schema";
import { getDb } from "../drizzle";
import { eq } from "drizzle-orm";
import { hashPasswordForStore } from "../../util/jwt";


export async function findUserByEmail(env: { DB: D1Database }, email: string) {
  const db = getDb(env);
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user[0] ?? null;
}

export async function insertUser(
  env: { DB: D1Database },
  email: string,
  name: string,
  phone: string,
  password: string,
  role: "Buyer" | "Seller" = "Buyer"
) {
  const db = getDb(env);
  const now = new Date();
   const stored = await hashPasswordForStore(password);
   const normalizedPhone = phone ? phone.replace(/\D/g, '') : null;
  const result = await db.insert(users).values({
    uid: crypto.randomUUID(),
    email,
    name,
    phone: normalizedPhone,
    password_hash: stored,
    role,
    is_verified: false,
    created_at: now,
    updated_at: now,
  }).returning();
  return result[0];
}

export async function phoneExists(env: { DB: D1Database }, phone: string): Promise<boolean> {
  const db = getDb(env);
  const normalizedPhone = phone.replace(/\D/g, '');
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phone, normalizedPhone))
    .limit(1);
  return result.length > 0;
}

export async function verifyUser(env: { DB: D1Database }, email: string) {
  const db = getDb(env);
  const result = await db
    .update(users)
    .set({ is_verified: true, updated_at: new Date() })
    .where(eq(users.email, email))
    .returning();
  return result[0];
}

