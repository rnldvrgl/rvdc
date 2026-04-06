import { NextRequest, NextResponse } from "next/server"

export default function middleware(request: NextRequest) {
  const access = request.cookies.get("access")?.value
  const refresh = request.cookies.get("refresh")?.value
  const role = request.cookies.get("role")?.value
  const { pathname, origin } = request.nextUrl

  const redirect = (path: string) => NextResponse.redirect(`${origin}${path}`)

  // Maintenance mode — show maintenance page to everyone
  if (process.env.MAINTENANCE_MODE === "true") {
    if (pathname !== "/maintenance") {
      return redirect("/maintenance")
    }
    return NextResponse.next()
  }

  // Prevent accessing /maintenance when not in maintenance mode
  if (pathname === "/maintenance") {
    return redirect("/")
  }

  // Consider user authenticated if either access or refresh token exists
  // (refresh can be used to get a new access token client-side)
  const isAuthenticated = !!access || !!refresh

  // Public pages - skip auth
  if (pathname === "/privacy-policy") {
    return NextResponse.next()
  }

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
