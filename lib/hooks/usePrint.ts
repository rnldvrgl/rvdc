import { useCallback, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useReactToPrint } from 'react-to-print'

interface UsePrintOptions<T> {
  documentTitle?: string
  onBeforePrint?: () => Promise<void>
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

  const reactToPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: options?.documentTitle ?? 'Document',
    onBeforePrint: options?.onBeforePrint,
    onAfterPrint: options?.onAfterPrint,
    onPrintError:
      options?.onPrintError ??
      ((loc, err) => toast.error(`Print error at ${loc}: ${err.message}`)),
  })

  const handlePrint = useCallback(
    (data?: TData) => {
      if (data) setPrintData(data)
      if (options?.requireConfirmation) {
        setShowPrintDialog(true)
      } else {
        reactToPrint()
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
