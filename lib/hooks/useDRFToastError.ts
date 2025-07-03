import { AxiosError } from 'axios'
import { useCallback } from 'react'
import toast from 'react-hot-toast'

function extractDRFErrorMessages(errorData: any): string {
  if (!errorData) return 'An unknown error occurred.'

  if (typeof errorData === 'string') {
    return errorData
  }

  if (Array.isArray(errorData)) {
    return errorData.join(', ')
  }

  if (typeof errorData === 'object') {
    if (errorData.non_field_errors) {
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
    (err: AxiosError<any> | any, fallback = 'Something went wrong.') => {
      const msg = extractDRFErrorMessages(err?.response?.data) || fallback
      toast.error(msg)
    },
    [],
  )

  return { handleError }
}
