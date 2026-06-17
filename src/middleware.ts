import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Protected routes that require authentication
const PROTECTED_PATHS = ["/circles", "/communities", "/wallet", "/settings", "/profile", "/notifications", "/contributions", "/payouts"]

export function middleware(request: NextRequest) {
  const token = request.cookies.get("moistello_token")?.value
  const { pathname } = request.nextUrl

  // Redirect unauthenticated users to login for protected routes
  if (!token) {
    for (const path of PROTECTED_PATHS) {
      if (pathname === path || pathname.startsWith(path + "/")) {
        const url = new URL("/login", request.url)
        return NextResponse.redirect(url)
      }
    }
  }

  // Redirect authenticated users away from login page
  if (token && pathname === "/login") {
    const url = new URL("/", request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next|static|favicon|locale|docs|p|about|how-it-works|faq|privacy|terms|status|developers|support|become-a-contributor).*)"],
}
