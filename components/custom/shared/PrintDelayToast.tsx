import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface CountdownToastProps {
  toastId: string | number
  delay: number
  onCancel: () => void
}

const CountdownToast = ({ toastId, delay, onCancel }: CountdownToastProps) => {
  const [remaining, setRemaining] = useState(delay / 1000)

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="w-full max-w-xs bg-background shadow-lg border border-border">
      <CardHeader className="flex flex-row items-center space-x-2">
        <Clock className="size-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium">
          Preparing to Print
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-4">
        <p className="text-muted-foreground">
          Printing in <span className="font-semibold">{remaining}s</span>. Click
          below to cancel.
        </p>
        <div className="flex justify-end mt-1">
          <Button
            onClick={() => {
              toast.dismiss(toastId)
              onCancel()
            }}
            variant="destructive"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export const showPrintDelayToast = (delay: number, onCancel: () => void) => {
  const toastId = toast.custom(
    (id) => (
      <CountdownToast
        toastId={id}
        delay={delay}
        onCancel={onCancel}
      />
    ),
    { duration: delay },
  )

  return toastId
}
