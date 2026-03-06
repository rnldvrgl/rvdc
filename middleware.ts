import { NextRequest, NextResponse } from "next/server"

export default function middleware(request: NextRequest) {
  const access = request.cookies.get("access")?.value
  const refresh = request.cookies.get("refresh")?.value
  const role = request.cookies.get("role")?.value
  const { pathname, origin } = request.nextUrl

  const redirect = (path: string) => NextResponse.redirect(`${origin}${path}`)

  // Consider user authenticated if either access or refresh token exists
  // (refresh can be used to get a new access token client-side)
  const isAuthenticated = !!access || !!refresh

  if (!isAuthenticated && pathname !== "/") {
    return redirect("/")
  }

  if (isAuthenticated && pathname === "/") {
    if (role == "technician") {
      return redirect("/attendance/timetable")
    }

    return redirect("/dashboard")
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
}
