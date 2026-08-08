// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const userType = request.cookies.get("userType")?.value;
  const { pathname } = request.nextUrl;

  // ==========================================
  // Allow payment pages for everyone
  // ==========================================
  if (
    pathname === "/sucessPay" ||
    pathname === "/unsucessPay" ||
    pathname === "/successPay" ||
    pathname === "/unsuccessPay"
  ) {
    console.log("✅ Allowing payment page:", pathname);
    return NextResponse.next();
  }

  // ==========================================
  // SELLER
  // ==========================================
  if (userType === "seller") {
    const allowedExactPaths = [
      "/seller/listing",
      "/seller/create-ads",

      // ✅ Seller can access chat
      "/chat",
    ];

    const allowedPrefixPaths = [
      "/seller/update-ads",
      "/chat/",
    ];

    const isAllowed =
      allowedExactPaths.includes(pathname) ||
      allowedPrefixPaths.some((prefix) => pathname.startsWith(prefix));

    if (!isAllowed) {
      console.log(
        "❌ Seller blocked from:",
        pathname,
        "→ redirecting to /seller/listing"
      );

      return NextResponse.redirect(
        new URL("/seller/listing", request.url)
      );
    }
  }

  // ==========================================
  // BUYER
  // ==========================================
  if (userType === "buyer") {
    if (pathname.startsWith("/seller")) {
      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }
  }

  // ==========================================
  // UNKNOWN / NOT LOGGED IN
  // ==========================================
  if (
    userType !== "buyer" &&
    userType !== "seller"
  ) {
    if (pathname.startsWith("/seller")) {
      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }
  }

  // ==========================================
  // CACHE CONTROL FOR SELLER PAGES
  // ==========================================
  const response = NextResponse.next();

  if (pathname.startsWith("/seller")) {
    response.headers.set(
      "Cache-Control",
      "no-store, max-age=0, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};