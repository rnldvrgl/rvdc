import { AxiosError } from 'axios'
import { useCallback } from 'react'
import toast from 'react-hot-toast'

type DRFErrorData =
  | string
  | string[]
  | Record<string, string | string[] | undefined>
  | null
  | undefined

function extractDRFErrorMessages(errorData: DRFErrorData): string {
  if (!errorData) return 'An unknown error occurred.'

  if (typeof errorData === 'string') {
    return errorData
  }

  if (Array.isArray(errorData)) {
    return errorData.join(', ')
  }

  if (typeof errorData === 'object') {
    if (Array.isArray(errorData.non_field_errors)) {
      return errorData.non_field_errors.join(', ')
    }

    const messages = Object.entries(errorData).map(([field, msgs]) => {
      if (Array.isArray(msgs)) {
        return `${field}: ${msgs.join(', ')}`
      } else {
        return `${field}: ${msgs}`
      }
    })
    return messages.join(' | ')
  }

  return 'An unexpected error occurred.'
}

export function useDRFToastError() {
  const handleError = useCallback(
    (err: unknown, fallback = 'Something went wrong.') => {
      const axiosErr = err as AxiosError<DRFErrorData>
      const msg = extractDRFErrorMessages(axiosErr?.response?.data) || fallback
      toast.error(msg)
    },
    [],
  )

  return { handleError }
}
