import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const { access, refresh, role } = await req.json();

	const response = NextResponse.json({ message: "Cookie set" });

	response.cookies.set("role", role, {
		httpOnly: true,
		secure: false,
		path: "/",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 7 * 30, // 30 days
	});

	response.cookies.set("access", access, {
		httpOnly: true,
		secure: false,
		path: "/",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 7, // 1 week
	});

	response.cookies.set("refresh", refresh, {
		httpOnly: true,
		secure: false,
		path: "/",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 7 * 30, // 30 days
	});

	return response;
}
