import { showPrintDelayToast } from '@/components/custom/shared/PrintDelayToast'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useReactToPrint } from 'react-to-print'

interface UsePrintOptions<T> {
  documentTitle?: string
  onBeforePrint?: (data: T | null) => Promise<void>
  onAfterPrint?: () => void
  onPrintError?: (location: string, error: Error) => void
  requireConfirmation?: boolean
}

export function usePrint<TData, TRef extends HTMLDivElement = HTMLDivElement>(
  options?: UsePrintOptions<TData>,
) {
  const printRef = useRef<TRef>(null)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [printData, setPrintData] = useState<TData | null>(null)

  const cancelledRef = useRef(false)

  const reactToPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: options?.documentTitle ?? 'Document',
    onBeforePrint: async () => {
      if (options?.onBeforePrint) {
        await options.onBeforePrint(printData)
      }
    },
    onAfterPrint: options?.onAfterPrint,
    onPrintError:
      options?.onPrintError ??
      ((loc, err) => toast.error(`Print error at ${loc}: ${err.message}`)),
  })

  const handlePrint = useCallback(
    (data?: TData) => {
      cancelledRef.current = false

      if (data) setPrintData(data)

      const toastId = showPrintDelayToast(3000, () => {
        cancelledRef.current = true
        toast.dismiss(toastId)
        toast.success('Print cancelled.')
      })

      if (options?.requireConfirmation) {
        setShowPrintDialog(true)
      } else {
        setTimeout(() => {
          if (!cancelledRef.current) {
            toast.dismiss(toastId)
            reactToPrint?.()
          }
        }, 3000)
      }
    },
    [reactToPrint, options?.requireConfirmation],
  )

  const confirmPrint = () => {
    setShowPrintDialog(false)
    reactToPrint?.()
  }

  const cancelPrint = () => {
    setShowPrintDialog(false)
    setPrintData(null)
  }

  return {
    printRef,
    handlePrint,
    confirmPrint,
    cancelPrint,
    showPrintDialog,
    setShowPrintDialog,
    printData,
  }
}
