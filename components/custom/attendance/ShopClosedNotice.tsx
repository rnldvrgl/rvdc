"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { tint } from "@/lib/utils/helpers"
import { AlertCircle, CheckCircle, Clock, Hand, Loader2, XCircle } from "lucide-react"

type WorkRequestState = {
    hasApprovedWorkRequest: boolean
    hasPendingWorkRequest: boolean
    hasDeclinedWorkRequest: boolean
    declineReason?: string | null
}

export function ShopClosedNotice({
    reason,
    state,
    onRequestWork,
    isRequesting,
}: {
    reason?: string | null
    state: WorkRequestState
    onRequestWork: () => void
    isRequesting: boolean
}) {
    const { hasApprovedWorkRequest, hasPendingWorkRequest, hasDeclinedWorkRequest, declineReason } = state

    const toneVar = hasApprovedWorkRequest
        ? "--success"
        : hasPendingWorkRequest
            ? "--warning"
            : hasDeclinedWorkRequest
                ? "--destructive"
                : null

    return (
        <div
            className="rounded-lg p-4 space-y-3 border"
            style={{
                borderColor: toneVar ? tint(toneVar, 30) : "var(--border)",
                backgroundColor: toneVar ? tint(toneVar, 8) : "var(--muted)",
            }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertCircle
                        className="h-4 w-4"
                        style={{ color: toneVar ? `var(${toneVar})` : "var(--muted-foreground)" }}
                    />
                    <span>Shop Closed</span>
                </div>
                {hasApprovedWorkRequest && (
                    <Badge variant="success">
                        <CheckCircle className="h-3 w-3" />
                        Approved
                    </Badge>
                )}
                {hasPendingWorkRequest && (
                    <Badge variant="warning">
                        <Clock className="h-3 w-3" />
                        Pending
                    </Badge>
                )}
                {hasDeclinedWorkRequest && (
                    <Badge variant="destructive">
                        <XCircle className="h-3 w-3" />
                        Declined
                    </Badge>
                )}
            </div>
            <p className="text-sm text-muted-foreground">
                {hasApprovedWorkRequest
                    ? "Your work request has been approved. You can clock in/out."
                    : hasPendingWorkRequest
                        ? "Your work request is pending admin approval."
                        : hasDeclinedWorkRequest
                            ? `Your work request has been declined.${declineReason ? ` Reason: ${declineReason}` : ""}`
                            : `The shop is closed today${reason && reason.toLowerCase() !== "shop closed" ? ` — ${reason}` : ""}.`}
            </p>
            {!hasApprovedWorkRequest && !hasPendingWorkRequest && !hasDeclinedWorkRequest && (
                <Button size="sm" className="w-full" disabled={isRequesting} onClick={onRequestWork}>
                    {isRequesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Hand className="h-4 w-4 mr-2" />}
                    Request to Work
                </Button>
            )}
        </div>
    )
}
