export const runtime = "edge";

import { NextResponse } from "next/server";

interface GeoData {
  country_code: string;
  region: string;
  city: string;
}

export async function GET() {
  // Development mode
  if (process.env.NODE_ENV === "development") {
    return NextResponse.json(
      {
        success: true,
        country_code: "BD",
        region: "Dhaka",
        city: "Dhaka",
      },
      { status: 200 }
    );
  }

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

    const data: GeoData = await res.json();

    return NextResponse.json(
      {
        success: true,
        country_code: data.country_code,
        region: data.region,
        city: data.city,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Geo API Error:", error);

    return NextResponse.json(
      { success: false, error: "Geo service unreachable" },
      { status: 500 }
    );
  }
}