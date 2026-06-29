export const runtime = 'edge';
import { NextResponse } from "next/server";
import { ENV } from "../../../../util/env";

interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    is_verified: boolean;
  };
  token?: string;
  error?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data: LoginResponse = await res.json();

    if (!res.ok || !data.success) {
      return NextResponse.json(
        { error: data.error || "Login failed" },
        { status: res.status }
      );
    }

    // ✅ Set cookie
    const response = NextResponse.json({ success: true, user: data.user,token: data.token }, { status: 200 });
    response.cookies.set(ENV.COOKIE_NAME, data.token!, {
      httpOnly: true,
      secure: ENV.COOKIE_SECURE,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
  } catch (err: unknown) {
    console.log('api error', err);
    
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json(
          { success: false, error: message },
      { status: 500 }
    );
  }
}
