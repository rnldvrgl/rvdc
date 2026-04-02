import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { access, refresh, role, rememberMe } = await req.json()

  const response = NextResponse.json({ message: "Cookie set" })

  const isProduction = process.env.NODE_ENV === "production"
  const persist = rememberMe !== false // default to persistent if not specified

  // Role cookie — always long-lived; used by middleware for role-based redirects
  if (role) {
    response.cookies.set("role", role, {
      httpOnly: true,
      secure: isProduction,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  }

  // Access cookie — 24h when persistent, session-only when not remembering
  if (access) {
    response.cookies.set("access", access, {
      httpOnly: true,
      secure: isProduction,
      path: "/",
      sameSite: "lax",
      ...(persist ? { maxAge: 60 * 60 * 24 } : {}), // 24h or session cookie
    })
  }

  // Refresh cookie — 30 days when persistent, session-only when not remembering
  if (refresh) {
    response.cookies.set("refresh", refresh, {
      httpOnly: true,
      secure: isProduction,
      path: "/",
      sameSite: "lax",
      ...(persist ? { maxAge: 60 * 60 * 24 * 30 } : {}), // 30 days or session cookie
    })
  }

  return response
}
