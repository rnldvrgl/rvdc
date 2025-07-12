import { useState } from 'react'

export function useConfirmClose({
  shouldConfirm,
  onClose,
}: {
  shouldConfirm: boolean
  onClose: () => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const tryClose = () => {
    if (shouldConfirm) {
      setConfirmOpen(true)
    } else {
      onClose()
    }
  }

  const confirmClose = () => {
    setConfirmOpen(false)
    onClose()
  }

  return { confirmOpen, setConfirmOpen, tryClose, confirmClose }
}
