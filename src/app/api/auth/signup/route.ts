// Remove edge runtime
      export const runtime = 'edge';
import { NextResponse } from "next/server";

interface SignupBody {
  name: string;
  email: string;
  phone: string;
  password: string;
  registrationType: "Buyer" | "Seller";
}

interface SignupResponse {
  success: boolean;
  error?: string;
  userId?: number;
  email?: string;
  name?: string;
  verifyUrl?: string;
  userType?: "buyer" | "seller";
}

export async function POST(req: Request) {
  try {
    const body: SignupBody = await req.json();

    console.log("Signup request for:", body.email);

    // Call Cloudflare Worker to create user
    const res = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data: SignupResponse = await res.json();

    if (!res.ok || !data.success) {
      console.error("Worker signup failed:", data.error);
      return NextResponse.json(
        { error: data.error || "Signup failed" },
        { status: res.status }
      );
    }

    console.log("User created successfully:", data.userId);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Signup API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}