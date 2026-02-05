import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { access, refresh, role } = await req.json()

  const response = NextResponse.json({ message: "Cookie set" })

  // Cookie settings with security best practices
  const isProduction = process.env.NODE_ENV === "production"

  response.cookies.set("role", role, {
    httpOnly: true,
    secure: isProduction,
    path: "/",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7 * 30, // 30 days
  })

  response.cookies.set("access", access, {
    httpOnly: true,
    secure: isProduction,
    path: "/",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })

  response.cookies.set("refresh", refresh, {
    httpOnly: true,
    secure: isProduction,
    path: "/",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7 * 30, // 30 days
  })

  return response
}
