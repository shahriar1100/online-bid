export const runtime = 'edge';
import { NextResponse } from "next/server";

interface ResetPasswordResponse {
  success?: boolean;
  message?: string;
  email?: string;
  error?: string;
}


export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/auth/reset-password?token=${token}`,
      { method: "GET" }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data: ResetPasswordResponse = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Failed to reset password" },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, message: data.message }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}