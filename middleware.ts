import { NextRequest, NextResponse } from "next/server";

const TERMINAL_HOST = "terminal.retinaos.xyz";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0];
  const { pathname } = request.nextUrl;

  if (
    hostname === TERMINAL_HOST &&
    pathname !== "/terminal" &&
    !pathname.startsWith("/terminal/") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    pathname !== "/favicon.ico" &&
    pathname !== "/favicon.svg"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/terminal" : `/terminal${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
