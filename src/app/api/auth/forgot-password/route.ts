export const runtime = 'edge';
import { NextResponse } from "next/server";

interface ForgotPasswordResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

     const data: ForgotPasswordResponse = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Failed to send reset link" },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, message: data.message }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}