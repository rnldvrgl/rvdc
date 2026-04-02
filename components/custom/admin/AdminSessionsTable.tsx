"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAdminSessionMutations } from "@/lib/mutations/useAdminSessionMutations"
import { AdminSession, useAdminSessions } from "@/lib/queries/useAdminSessions"
import { formatDateTimeFull } from "@/lib/utils/helpers/date"
import { Trash2 } from "lucide-react"
import { useState } from "react"

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) <= new Date()
}

export function AdminSessionsTable() {
  const { data: sessions, isLoading } = useAdminSessions()
  const { revokeSession } = useAdminSessionMutations()
  const [sessionToRevoke, setSessionToRevoke] = useState<AdminSession | null>(
    null,
  )

  
  const handleRevokeClick = (session: AdminSession) => {
    setSessionToRevoke(session)
  }

  const handleConfirmRevoke = async () => {
    if (sessionToRevoke) {
      await revokeSession.mutateAsync(sessionToRevoke.id)
      setSessionToRevoke(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No active sessions found
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Browser & OS</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const expired = isExpired(session.expires_at)
              const browser = session.browser_name || session.device_label || "Unknown Browser"
              const os = session.os_name || ""

              return (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {session.user.first_name} {session.user.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        @{session.user.username}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{browser}</span>
                      {os && (
                        <span className="text-xs text-muted-foreground">{os}</span>
                      )}
                      {session.remember_me && (
                        <Badge variant="outline" className="mt-1 w-fit text-[10px] py-0 px-1.5 h-4">
                          Remember me
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {session.ip_address || "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDateTimeFull(new Date(session.last_seen_at))}
                  </TableCell>
                  <TableCell className="text-sm">
                    {session.expires_at ? (
                      <div className="flex flex-col gap-0.5">
                        <span className={expired ? "text-muted-foreground line-through" : ""}>
                          {formatDateTimeFull(new Date(session.expires_at))}
                        </span>
                        {expired && (
                          <span className="text-xs text-muted-foreground">Expired</span>
                        )}
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={session.is_active && !expired ? "default" : "secondary"}>
                      {session.is_active && !expired ? "Active" : "Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {session.is_active && !expired && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeClick(session)}
                        disabled={revokeSession.isPending}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Confirm Revoke Dialog */}
      <AlertDialog
        open={!!sessionToRevoke}
        onOpenChange={(open) => {
          if (!open) setSessionToRevoke(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Revoke Session</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to revoke this session for{" "}
            <strong>
              {sessionToRevoke?.user.first_name}{" "}
              {sessionToRevoke?.user.last_name}
            </strong>{" "}
            on{" "}
            <strong>
              {sessionToRevoke?.browser_name || sessionToRevoke?.device_label}
            </strong>
            {sessionToRevoke?.os_name ? ` (${sessionToRevoke.os_name})` : ""}?
            <br />
            <br />
            They will be logged out of this device.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRevoke}
              disabled={revokeSession.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {revokeSession.isPending ? "Revoking..." : "Revoke"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
