export const runtime = "edge";

import { NextResponse } from "next/server";

interface GeoData {
  country_code: string;
  region: string;
  city: string;
}

export async function GET() {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      headers: {
        "User-Agent": "auction-hive",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "Geo lookup failed" },
        { status: res.status }
      );
    }

    const data = await res.json() as GeoData;

    return NextResponse.json(
      {
        success: true,
        country_code: data.country_code,
        region: data.region,
        city: data.city,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Geo service unreachable" },
      { status: 500 }
    );
  }
}
