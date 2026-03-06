import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { access, refresh, role } = await req.json()

  const response = NextResponse.json({ message: "Cookie set" })

  const isProduction = process.env.NODE_ENV === "production"

  // Role cookie — long-lived, used by middleware for redirects
  if (role) {
    response.cookies.set("role", role, {
      httpOnly: true,
      secure: isProduction,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  }

  // Access cookie — matches backend ACCESS_TOKEN_LIFETIME (12h)
  if (access) {
    response.cookies.set("access", access, {
      httpOnly: true,
      secure: isProduction,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 12, // 12 hours
    })
  }

  // Refresh cookie — matches backend REFRESH_TOKEN_LIFETIME (30 days)
  if (refresh) {
    response.cookies.set("refresh", refresh, {
      httpOnly: true,
      secure: isProduction,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  }

  return response
}
