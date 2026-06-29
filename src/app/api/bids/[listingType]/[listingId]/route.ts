// app/api/bids/[listingType]/[listingId]/route.ts
export const runtime = "edge";
import { NextResponse } from "next/server";
import { ENV } from "../../../../../util/env";

interface AuctionSessionResponse {
  success: boolean;
  session?: {
    id: number;
    listingId: number;
    listingType: string;
    startTime: number;
    endTime: number;
    status: string;
    startingPrice: string;
    currentBid: string;
    winnerUserId?: number;
    winningBid?: string;
  } | null;
  message?: string;
  error?: string;
}

type RouteParams = {
  params: Promise<{ listingType: string; listingId: string }>;
};

export async function GET(
  req: Request,
  { params }: RouteParams
) {
  try {
     const { listingType, listingId } = await params;

    // Validate listing type
    if (!["realestate", "automobile", "business"].includes(listingType)) {
      return NextResponse.json(
        { success: false, error: "Invalid listing type" },
        { status: 400 }
      );
    }

    // Validate listing ID
    const id = parseInt(listingId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid listing ID" },
        { status: 400 }
      );
    }

    // Proxy to Worker
    const res = await fetch(
      `${ENV.NEXT_PUBLIC_WRANGLER_API_URL}/api/auction/${listingType}/${listingId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data: AuctionSessionResponse = await res.json();

    if (!res.ok) {
      console.error("Worker error:", data);
      return NextResponse.json(
        { success: false, error: data.error || "Failed to fetch auction session" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    console.error("Next.js auction route error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}