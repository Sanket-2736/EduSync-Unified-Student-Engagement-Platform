import { NextRequest, NextResponse } from "next/server";

/**
 * Routes that require authentication.
 * Matched as prefixes — any path starting with these is protected.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/tools",
  "/chat",
  "/loan",
];

/**
 * Routes that are always public (no redirect even if unauthenticated).
 */
const PUBLIC_PATHS = ["/", "/login", "/onboard", "/signup"];

const TOKEN_COOKIE = "studyai_token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths and Next.js internals
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".");

  if (isPublic) return NextResponse.next();

  // Check if the path is protected
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (!isProtected) return NextResponse.next();

  // Read token from cookie
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists — let the request through.
  // Full JWT verification happens in the backend middleware on each API call.
  // For extra security you could verify the JWT here too using jose (edge-compatible).
  return NextResponse.next();
}

export const config = {
  // Run on all routes except static files and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
