import { NextRequest, NextResponse } from 'next/server';

// No-op middleware: no custom logic, no redirects, no session mutation.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|signup|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 