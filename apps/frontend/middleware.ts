import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection middleware — per authentication.md §5.
 *
 * Since Next.js middleware runs at the Edge and cannot access in-memory state,
 * it uses the presence of the `refresh_token` HttpOnly cookie as a proxy for
 * "is the user likely authenticated?".
 *
 * The actual access token validation is performed by the FastAPI backend on
 * every protected API call.
 */
export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token");
  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  // Unauthenticated user trying to access a protected route → redirect to /login
  if (!refreshToken && !isAuthRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname); // Preserve intended destination
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access auth routes → redirect to /dashboard
  if (refreshToken && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/meetings/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
