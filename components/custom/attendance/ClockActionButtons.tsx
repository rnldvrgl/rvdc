"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Loader2, LogIn, LogOut } from "lucide-react"

export function ClockActionButtons({
    onClockIn,
    onClockOut,
    clockInDisabled,
    clockOutDisabled,
    isClockingIn,
    isClockingOut,
}: {
    onClockIn: () => void
    onClockOut: () => void
    clockInDisabled: boolean
    clockOutDisabled: boolean
    isClockingIn: boolean
    isClockingOut: boolean
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                    onClick={onClockIn}
                    disabled={clockInDisabled || isClockingIn}
                    className="h-10 sm:h-11 w-full"
                    size="lg"
                    variant="success"
                >
                    {isClockingIn ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <LogIn className="mr-2 h-4 w-4" />
                            Clock In
                        </>
                    )}
                </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                    onClick={onClockOut}
                    disabled={clockOutDisabled || isClockingOut}
                    variant="destructive"
                    className="h-10 sm:h-11 w-full"
                    size="lg"
                >
                    {isClockingOut ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <LogOut className="mr-2 h-4 w-4" />
                            Clock Out
                        </>
                    )}
                </Button>
            </motion.div>
        </div>
    )
}
