import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow auth API routes and static assets
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check for our custom admin session cookie
  const sessionCookie =
    req.cookies.get("getmaterials-admin-session") ||
    req.cookies.get("__Secure-getmaterials-admin-session");

  // Login page — redirect to dashboard if already logged in
  if (pathname.startsWith("/login")) {
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Protect everything else
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
