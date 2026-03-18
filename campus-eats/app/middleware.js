import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Middleware only reads cookies from the request header
  const userRole = request.cookies.get('userRole')?.value;

  // 1. Protect Merchant Dashboard
  if (pathname.startsWith('/merchant/dashboard') && userRole !== 'merchant') {
    return NextResponse.redirect(new URL('/merchant/login', request.url));
  }

  // 2. Protect Eatery Pages
  if (pathname.startsWith('/eatery') && !userRole) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// export const config = {
//   // matcher: ['/eatery/:path*', '/merchant/dashboard/:path*'],

// };
export const config = {
  matcher: [
    '/eatery/:path*',
    '/merchant/:path*', // This covers /merchant/dashboard and everything under it
    '/checkout',
    '/status/:path*'
  ],
};