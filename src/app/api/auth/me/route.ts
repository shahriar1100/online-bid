// src/app/api/auth/me/route.ts
export const dynamic = 'force-dynamic'; 
export const runtime = 'edge';
import { NextResponse } from "next/server";
import { verifyJWT } from "../../../../util/jwt";
import { cookies } from "next/headers";
import { ENV } from "../../../../util/env";

export async function GET() {
     const cookieStore = await cookies();
  const token = cookieStore.get(ENV.COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = await verifyJWT(token, ENV.JWT_SECRET);
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user: payload });
}
