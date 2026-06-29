// app/api/realestate/route.ts
export const runtime = "edge";
import { NextResponse } from "next/server";
import { ENV } from "../../../util/env";

// Use the same interface as your database model (camelCase)
export interface InsertRealStateInput {
  userId: number;
  title: string;
  category: string;
  subcategory: string;
  auctionType: string;
  duration: string;
  description: string;
  media?: { name: string; size: number; type: string }[];
  propertyAddress: string;
  propertyCountry: string;
  propertyState: string;
  propertyCity: string;
  propertyPincode?: string;
  bedroom?: string;
  bathroom?: string;
  area?: string;
  price?: string;
  builtInYear?: string;
  furnishing?: string;
  utilities?: string[];
  features?: string[];
  auctionPrice?: string;
  auctionDate?: string;
  expiry?: string;
  ownershiptype?: string;
  ownershiptitle?: string;
  ownershipstatus?: string;
  legalDescription?: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  isAgent?: string;
  licenseNumber?: string;
  authorizedToSell?: boolean;
  agreeTerms?: boolean;
}

interface RealEstateResponse {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listing?: any;
  error?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as InsertRealStateInput;
    
    console.log("Next.js route received:", body);
    
    // Validate required fields
    if (!body.userId || !body.title || !body.category || !body.contactName || !body.contactEmail) {
      console.log("Missing required fields in Next.js route");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Proxy to your Worker with the same camelCase format
    const res = await fetch(`${ENV.NEXT_PUBLIC_WRANGLER_API_URL}/api/realestate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), // Forward as-is since formats match
    });
    
    const data: RealEstateResponse = await res.json();
    
    if (!res.ok || !data.success) {
      console.error("Worker error:", data);
      return NextResponse.json(
        { error: data.error || "Failed to save listing" },
        { status: res.status }
      );
    }
    
    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    console.error("Next.js route error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}