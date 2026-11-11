import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/shared/lib/constants";

// /account /checkout /adminはCookie有無だけをチェックする（docs/frontend/routing.md）。
// 実際のrole確認（adminかどうか）はServer ComponentのrequireAdmin()が行う。
const PROTECTED_PREFIXES = ["/account", "/checkout", "/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !request.cookies.has(SESSION_COOKIE_NAME)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/admin/:path*"],
};
