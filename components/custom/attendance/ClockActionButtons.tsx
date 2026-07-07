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
        <div className="grid grid-cols-1 font-mono!">
            {clockOutDisabled ? (
                <motion.div whileTap={{ scale: 0.97 }}>
                    <Button
                        onClick={onClockIn}
                        disabled={clockInDisabled || isClockingIn}
                        className="h-16 sm:h-17 w-full gap-2.5   font-semibold"
                        size="lg"
                        variant="success"
                    >
                        {isClockingIn ? (
                            <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 animate-spin" />
                        ) : (
                            <>
                                <LogIn className="h-6 w-6 sm:h-7 sm:w-7" />
                                Clock In
                            </>
                        )}
                    </Button>
                </motion.div>
            ) : (
                <motion.div whileTap={{ scale: 0.97 }}>
                    <Button
                        onClick={onClockOut}
                        disabled={clockOutDisabled || isClockingOut}
                        variant="destructive"
                        className="h-16 sm:h-17 w-full gap-2.5   font-semibold"
                        size="lg"
                    >
                        {isClockingOut ? (
                            <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 animate-spin" />
                        ) : (
                            <>
                                <LogOut className="h-6 w-6 sm:h-7 sm:w-7" />
                                Clock Out
                            </>
                        )}
                    </Button>
                </motion.div>
            )}
        </div>
    )
}
