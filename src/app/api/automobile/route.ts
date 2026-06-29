export const runtime = "edge";
import { NextResponse } from "next/server";
import { ENV } from "../../../util/env";

export interface InsertAutomobileInput {
  userId: number;
  title: string;
  category: string;
  subcategory: string;
  duration: string;
  description: string;
  media?: { name: string; size: number; type: string }[];
  make: string;
  model: string;
  builtInYear: string;
  body: string;
  fuel: string;
  transmission: string;
  engine: string;
  drive: string;
  odometer: string;
  odometerUnit: string;
  condition: string;
  accidenthistory?: string;
  history?: string;
  shistory?: string;
  owner: string;
  vnumber: string;
  automobileCountry: string;
  automobileState: string;
  automobileCity: string;
  automobilePincode?: string;
  price: string;
  negotiable?: boolean;
  mobilefeature?: string[];
  warranty?: string;
  warrantydetails?: string;
}

interface AutomobileResponse {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listing?: any;
  error?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as InsertAutomobileInput;

    console.log("Automobile API received:", body);

    if (!body.userId || !body.title || !body.category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const res = await fetch(`${ENV.NEXT_PUBLIC_WRANGLER_API_URL}/api/automobile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data: AutomobileResponse = await res.json();

    if (!res.ok || !data.success) {
      console.error("Worker error:", data);
      return NextResponse.json(
        { error: data.error || "Failed to save automobile listing" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    console.error("Next.js automobile route error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
