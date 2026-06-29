// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const userType = request.cookies.get('userType')?.value
  const { pathname } = request.nextUrl

  // ✅ FIRST: Allow payment pages for EVERYONE (before any user type checks)
  if (
    pathname === '/sucessPay' || 
    pathname === '/unsucessPay' ||
    pathname === '/successPay' ||  // in case you fix the typo later
    pathname === '/unsuccessPay'
  ) {
    console.log('✅ Allowing payment page:', pathname)
    return NextResponse.next()
  }

  // Now handle seller restrictions
  if (userType === 'seller') {
    const allowedExactPaths = [
      '/seller/listing',
      '/seller/create-ads',
    ]

    const allowedPrefixPaths = [
      '/seller/update-ads',
    ]

    const isAllowed =
      allowedExactPaths.includes(pathname) ||
      allowedPrefixPaths.some(prefix => pathname.startsWith(prefix))

    if (!isAllowed) {
      console.log('❌ Seller blocked from:', pathname, '→ redirecting to /seller/listing')
      return NextResponse.redirect(
        new URL('/seller/listing', request.url)
      )
    }
  }

  if (userType === 'buyer') {
    if (pathname.startsWith('/seller')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
   
    if (userType !=='buyer'&& userType !=='seller') {
    if (pathname.startsWith('/seller')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  const response = NextResponse.next()
  if (pathname.startsWith('/seller')) {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}