import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("moistello_token")?.value
  const { pathname } = request.nextUrl

  if (token && pathname === "/") {
    const url = new URL("/dashboard", request.url)
    return NextResponse.rewrite(url)
  }

  if (pathname === "/dashboard" && !token) {
    const url = new URL("/login", request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/dashboard"],
}
