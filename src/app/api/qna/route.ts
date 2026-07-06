export const runtime = "edge";

import { NextResponse } from "next/server";
import { ENV } from "../../../util/env";

type ListingType = "realestate" | "automobile" | "business";

interface CreateQuestionInput {
  listingId: number;
  listingType: ListingType;
  question: string;
}

interface QnaResponse {
  success: boolean;
  data?: unknown;
  message?: string;
  error?: string;
}

/**
 * GET /api/qna?listingId=1&listingType=realestate
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const listingId = searchParams.get("listingId");
    const listingType = searchParams.get("listingType");

    if (!listingId || !listingType) {
      return NextResponse.json(
        {
          success: false,
          error: "listingId and listingType are required",
        },
        { status: 400 }
      );
    }

    if (
      !["realestate", "automobile", "business"].includes(listingType)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid listing type",
        },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${ENV.NEXT_PUBLIC_WRANGLER_API_URL}/api/qna?listingId=${listingId}&listingType=${listingType}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data: QnaResponse = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || "Failed to fetch questions",
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qna
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const body = (await req.json()) as CreateQuestionInput;

    if (
      !body.listingId ||
      !body.listingType ||
      !body.question?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    if (
      !["realestate", "automobile", "business"].includes(body.listingType)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid listing type",
        },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${ENV.NEXT_PUBLIC_WRANGLER_API_URL}/api/qna`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      }
    );

    const data: QnaResponse = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || "Failed to submit question",
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data, {
      status: 201,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}