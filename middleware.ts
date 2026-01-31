import { NextRequest, NextResponse } from "next/server";

export default function middleware(request: NextRequest) {
	const access = request.cookies.get("access")?.value;
	const role = request.cookies.get("role")?.value;
	const { pathname, origin } = request.nextUrl;

	const redirect = (path: string) =>
		NextResponse.redirect(`${origin}${path}`);

	if (!access && pathname !== "/") {
		return redirect("/");
	}

	if (access && pathname === "/") {
		if (role == "technician") {
			return redirect("/attendance/timetable");
		}

		return redirect("/dashboard");
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
