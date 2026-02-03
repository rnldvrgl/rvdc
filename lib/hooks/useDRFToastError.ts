import { isAxiosError } from "axios"
import { useCallback } from "react"
import { toast } from "sonner"

type DRFErrorData = string | string[] | Record<string, string | string[]>

export function extractDRFErrorMessages(errorData: DRFErrorData): string {
  if (!errorData) {
    return "An unknown error occurred."
  }

  // Plain string
  if (typeof errorData === "string") {
    return errorData
  }

  // Array of messages
  if (Array.isArray(errorData)) {
    return errorData.join(", ")
  }

  // Object (most DRF responses)
  if (typeof errorData === "object") {
    // Common DRF pattern
    if (typeof errorData.detail === "string") {
      return errorData.detail
    }

    // Another common DRF pattern
    if (Array.isArray(errorData.non_field_errors)) {
      return errorData.non_field_errors.join(", ")
    }

    // Generic field errors
    const messages: string[] = []

    for (const [field, value] of Object.entries(errorData)) {
      if (Array.isArray(value)) {
        messages.push(`${field}: ${value.join(", ")}`)
      } else if (typeof value === "string") {
        messages.push(`${field}: ${value}`)
      }
    }

    if (messages.length > 0) {
      return messages.join(" | ")
    }
  }

  return "An unexpected error occurred."
}

export function useDRFToastError() {
  const handleError = useCallback(
    (err: unknown, fallback = "Something went wrong.") => {
      let message = fallback

      if (isAxiosError(err)) {
        // Network / CORS / timeout
        if (!err.response) {
          message =
            err.message || "Network error. Please check your connection."
        } else {
          message = extractDRFErrorMessages(err.response.data)
        }
      } else if (err instanceof Error) {
        message = err.message
      }

      toast.error(message)
    },
    [],
  )

  return { handleError }
}
