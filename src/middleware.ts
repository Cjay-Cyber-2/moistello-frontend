import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { buildCsp, generateNonce } from "@/lib/security/csp"
import { API_CSP } from "@/lib/security/api-csp.mjs"
import {
  ACCESS_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  CSRF_TOKEN_MAX_AGE,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth/session-cookies"

// Protected routes that require authentication
const PROTECTED_PATHS = ["/circles", "/communities", "/wallet", "/settings", "/profile", "/notifications", "/contributions", "/payouts"]

// Dev-only API routes backed by flat-file JSON storage.  These are useful
// for local development but must never be reachable in a deployed environment.
// The middleware blocks them as the first line of defence; each handler also
// calls blockInProduction() as defence-in-depth.
const DEV_ONLY_API_PATHS = [
  "/api/auth/login",
  "/api/auth/setup",
  "/api/upload",
  "/api/auth/logout",
  "/api/auth",
]

/** Request header the root layout reads to nonce its inline <script> tags. */
export const NONCE_HEADER = "x-nonce"
export const CSRF_HEADER = "x-csrf-token"

function generateCsrfToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes))
}

function attachCsrfCookie(response: NextResponse, csrfToken: string) {
  response.cookies.set(CSRF_TOKEN_COOKIE, csrfToken, {
    ...SESSION_COOKIE_OPTIONS,
    httpOnly: false,
    maxAge: CSRF_TOKEN_MAX_AGE,
  })
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block dev-only API routes in production at the middleware level.
  // Returns 404 so the routes' existence is never advertised.
  if (process.env.NODE_ENV === "production") {
    for (const path of DEV_ONLY_API_PATHS) {
      if (pathname === path || pathname.startsWith(path + "/")) {
        // /api/auth is the dev-only session-check handler.  Production
        // sub-routes (/api/auth/session, /api/auth/refresh, …) must not be
        // blocked, so require an exact match for the bare /api/auth path.
        if (path === "/api/auth" && pathname !== path) continue
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
    }
  }

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value

  // API routes return JSON, never HTML, so they must not receive the page CSP
  // with its per-request script nonce and third-party script sources. They get
  // the static, minimal API policy instead (same one next.config.mjs serves via
  // headers()). The nonce is still minted — it travels on the request for
  // pages that render inline scripts — but the API response advertises no
  // script allowances at all.
  const nonce = generateNonce()
  const isApiRoute = pathname.startsWith("/api/")
  const csp = isApiRoute ? API_CSP : buildCsp(nonce)
  const csrfToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value || generateCsrfToken()
  const shouldSetCsrfCookie = !request.cookies.has(CSRF_TOKEN_COOKIE)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(NONCE_HEADER, nonce)
  requestHeaders.set(CSRF_HEADER, csrfToken)
  
  // #211: Add locale header for dynamic lang attribute
  const locale = request.cookies.get("moistello_locale")?.value || "en"
  requestHeaders.set("x-locale", locale)

  // #207: CSRF protection for mutating API routes
  if (isApiRoute && ["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    const origin = request.headers.get("origin")
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || "https://moistello.com",
      "http://localhost:3000",
    ]
    
    if (!origin || !allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed))) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
    }
    
    const clientCsrf = request.headers.get("x-csrf-token")
    if (clientCsrf !== csrfToken) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
    }
  }

  // Redirect unauthenticated users to login for protected routes
  if (!token) {
    for (const path of PROTECTED_PATHS) {
      if (pathname === path || pathname.startsWith(path + "/")) {
        const url = new URL("/login", request.url)
        const redirect = NextResponse.redirect(url)
        redirect.headers.set("Content-Security-Policy", csp)
        if (shouldSetCsrfCookie) attachCsrfCookie(redirect, csrfToken)
        return redirect
      }
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set("Content-Security-Policy", csp)
  if (shouldSetCsrfCookie) attachCsrfCookie(response, csrfToken)
  return response
}

export const config = {
  // Every HTML document must carry the CSP header, so the matcher covers all
  // page routes and excludes only framework internals and static assets.
  // The dev-only API paths are listed explicitly so the middleware can block
  // them in production before any route handler executes.
  matcher: [
    "/((?!_next|favicon|static|locale|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff|woff2)$).*)",
    "/api/auth/login",
    "/api/auth/setup",
    "/api/upload",
    "/api/auth/logout",
    "/api/auth",
  ],
}
