import { NextResponse } from "next/server"

export const runtime = "edge"

export const dynamic = "force-dynamic"

function healthResponse() {
    return NextResponse.json(
        { status: "ok" },
        {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
            },
        },
    )
}

export async function GET() {
    return healthResponse()
}

export async function HEAD() {
    return healthResponse()
}
