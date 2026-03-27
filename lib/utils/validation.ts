/**
 * Validation utilities for forms and data
 * Extracted from components and schemas
 */

/**
 * Validate Philippine phone number
 * Accepts formats:
 * - +639XXXXXXXXX (international)
 * - 09XXXXXXXXX (local with leading 0)
 * - 9XXXXXXXXX (without leading 0)
 * Converts +639 → 09 format
 * @param phoneNumber - Phone number string to validate
 * @returns Object with isValid and normalizedNumber properties
 * @example
 * validatePhoneNumber("+639123456789")
 * // → { isValid: true, normalizedNumber: "09123456789" }
 *
 * validatePhoneNumber("09123456789")
 * // → { isValid: true, normalizedNumber: "09123456789" }
 */
export function validatePhoneNumber(phoneNumber: string): {
  isValid: boolean
  normalizedNumber?: string
} {
  if (!phoneNumber || typeof phoneNumber !== "string") {
    return { isValid: false }
  }

  const cleaned = phoneNumber.trim()

  // Convert +639... to 09...
  let normalized = cleaned.startsWith("+639") ? "0" + cleaned.slice(3) : cleaned

  // Remove any spaces or dashes
  normalized = normalized.replace(/[\s-]/g, "")

  // Check if it matches Philippine phone number format
  // Should be 09XXXXXXXXX (11 digits) or 9XXXXXXXXX (10 digits)
  const isValid = /^09\d{9}$/.test(normalized) || /^9\d{9}$/.test(normalized)

  if (!isValid) {
    return { isValid: false }
  }

  // Ensure it starts with 0
  const finalNumber = normalized.startsWith("0") ? normalized : "0" + normalized

  return { isValid: true, normalizedNumber: finalNumber }
}

/**
 * Check if a string is a valid email
 * @param email - Email string to validate
 * @returns Boolean indicating if email is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Check if a string is a valid URL
 * @param url - URL string to validate
 * @returns Boolean indicating if URL is valid
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate a ZIP/postal code (Philippine format)
 * Philippine ZIP codes are 4 digits
 * @param zipCode - ZIP code to validate
 * @returns Boolean indicating if ZIP code is valid
 */
export function validateZipCode(zipCode: string): boolean {
  return /^\d{4}$/.test(zipCode.trim())
}

/**
 * Validate a credit card number using Luhn algorithm
 * @param cardNumber - Credit card number (digits only)
 * @returns Boolean indicating if card number is valid
 */
export function validateCreditCard(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\D/g, "")

  if (cleaned.length < 13 || cleaned.length > 19) return false

  let sum = 0
  let isEven = false

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

/**
 * Check if a string is not empty (after trimming)
 * @param value - String to check
 * @returns Boolean indicating if string is not empty
 */
export function isNotEmpty(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0
}

/**
 * Check if a value meets minimum length requirement
 * @param value - String to check
 * @param minLength - Minimum length required
 * @returns Boolean indicating if string meets minimum length
 */
export function meetsMinLength(value: string, minLength: number): boolean {
  return isNotEmpty(value) && value.length >= minLength
}

/**
 * Check if a value meets maximum length requirement
 * @param value - String to check
 * @param maxLength - Maximum length allowed
 * @returns Boolean indicating if string meets maximum length
 */
export function meetsMaxLength(value: string, maxLength: number): boolean {
  return !value || value.length <= maxLength
}

/**
 * Check if a string contains only numbers
 * @param value - String to check
 * @returns Boolean indicating if string contains only numbers
 */
export function isNumeric(value: string): boolean {
  return /^\d+$/.test(value.trim())
}

/**
 * Check if a string contains only letters and spaces
 * @param value - String to check
 * @returns Boolean indicating if string contains only letters and spaces
 */
export function isAlphabetic(value: string): boolean {
  return /^[a-zA-Z\s]+$/.test(value.trim())
}

/**
 * Check if a string contains alphanumeric characters only
 * @param value - String to check
 * @returns Boolean indicating if string is alphanumeric
 */
export function isAlphanumeric(value: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(value.trim())
}
