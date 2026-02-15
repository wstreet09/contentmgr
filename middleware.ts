import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

// Simple in-memory rate limiting
const rateMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMITS = {
  read: { max: 100, windowMs: 60_000 },
  write: { max: 20, windowMs: 60_000 },
}

function isWriteMethod(method: string) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method)
}

function checkRateLimit(key: string, limit: { max: number; windowMs: number }): boolean {
  const now = Date.now()
  const entry = rateMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + limit.windowMs })
    return true
  }

  if (entry.count >= limit.max) {
    return false
  }

  entry.count++
  return true
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET })

  // Rate-limit API routes
  if (pathname.startsWith("/api/")) {
    const userId = (token?.id as string) || req.ip || "anonymous"
    const isWrite = isWriteMethod(req.method)
    const limit = isWrite ? RATE_LIMITS.write : RATE_LIMITS.read
    const key = `${userId}:${isWrite ? "write" : "read"}`

    if (!checkRateLimit(key, limit)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      )
    }
  }

  // Admin login page: allow through without auth
  if (pathname === "/admin/login") {
    return NextResponse.next()
  }

  // Admin routes: require isSuperAdmin
  if (pathname.startsWith("/admin")) {
    if (!token?.isSuperAdmin) {
      return NextResponse.redirect(new URL("/admin/login", req.url))
    }
    return NextResponse.next()
  }

  // Auth check for protected routes (non-API)
  if (!token && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/article/:path*",
    "/community/:path*",
    "/projects/:path*",
    "/video/:path*",
    "/settings/:path*",
    "/api/((?!auth).+)",
  ],
}
