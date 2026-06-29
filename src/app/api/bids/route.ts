// app/api/bids/route.ts
export const runtime = "edge";
import { NextResponse } from "next/server";
import { ENV } from "../../../util/env";

interface CreateBidInput {
  listingId: number;
  listingType: "realestate" | "automobile" | "business";
  bidAmount: string;
}

interface BidResponse {
  success: boolean;
  bid?: {
    id: number;
    bid: string;
    user: string;
    userId: number;
    time: string;
    createdAt: string;
  };
  message?: string;
  error?: string;
}

export async function POST(req: Request) {
  try {
    // Get auth token from header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as CreateBidInput;

    console.log("Next.js bids route received:", body);

    // Validate required fields
    if (!body.listingId || !body.listingType || !body.bidAmount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate listing type
    if (!["realestate", "automobile", "business"].includes(body.listingType)) {
      return NextResponse.json(
        { success: false, error: "Invalid listing type" },
        { status: 400 }
      );
    }

    // Validate bid amount
    const bidAmountNum = parseFloat(body.bidAmount);
    if (isNaN(bidAmountNum) || bidAmountNum < 1) {
      return NextResponse.json(
        { success: false, error: "Minimum bid amount is $1" },
        { status: 400 }
      );
    }

    // Proxy to Worker
    const res = await fetch(`${ENV.NEXT_PUBLIC_WRANGLER_API_URL}/api/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data: BidResponse = await res.json();

    if (!res.ok || !data.success) {
      console.error("Worker error:", data);
      return NextResponse.json(
        { success: false, error: data.error || "Failed to place bid" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    console.error("Next.js bids route error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}