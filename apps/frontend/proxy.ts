import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection proxy, per authentication.md section 5.
 *
 * Since Next.js proxy runs before protected routes and cannot access in-memory state,
 * it uses the presence of the `refresh_token` HttpOnly cookie as a proxy for
 * "is the user likely authenticated?".
 *
 * The actual access token validation is performed by the FastAPI backend on
 * every protected API call.
 */
export function proxy(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token");
  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  if (!refreshToken && !isAuthRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/meetings/:path*",
    "/search/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
