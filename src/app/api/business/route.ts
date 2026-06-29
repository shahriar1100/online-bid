export const runtime = "edge";

import { NextResponse } from "next/server";
import { ENV } from "../../../util/env";

export interface InsertBusinessInput {
  userId: number;
  
  // General Details
  title: string;
  category: string;
  subcategory: string;
  auctionType: string;
  duration: string;
  description: string;
  media?: { name: string; size: number; type: string }[];
  
  // Business Details
  builtInYear?: string;
  businessAddress?: string;
  businessCountry?: string;
  businessState?: string;
  businessCity?: string;
  businessPincode?: string;
  
  // Business Descriptions
  highlight?: string;
  reason?: string;
  
  // Financial Information
  price?: string;
  revenue?: string;
  profit?: string;
  assets?: string;
  inventory?: string;
  inventoryValue?: string;
  
  // Operational Details
  employes?: string;
  involvement?: string;
  relocatable?: string;
  homebase?: string;
  franchise?: string;
  namefranchise?: string;
  
  // Facilities and Lease
  premises?: string;
  monthly?: string;
  expiry?: string;
  facilitysize?: string;
}

interface BusinessResponse {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listing?: any;
  error?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as InsertBusinessInput;
    console.log("Business API received:", body);

    // Validate required fields
    if (!body.userId || !body.title || !body.category || !body.subcategory || !body.auctionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Call your Cloudflare Worker API
    const res = await fetch(`${ENV.NEXT_PUBLIC_WRANGLER_API_URL}/api/business`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data: BusinessResponse = await res.json();

    if (!res.ok || !data.success) {
      console.error("Worker error:", data);
      return NextResponse.json(
        { error: data.error || "Failed to save business listing" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    console.error("Next.js business route error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// Optional: GET endpoint to fetch business listings
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const url = id 
      ? `${ENV.NEXT_PUBLIC_WRANGLER_API_URL}/api/business/${id}`
      : `${ENV.NEXT_PUBLIC_WRANGLER_API_URL}/api/business`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data:BusinessResponse = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch business listing(s)" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    console.error("Next.js business GET route error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}