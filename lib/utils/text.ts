/**
 * Text and string transformation utilities
 * Extracted from components for centralized string processing
 */

/**
 * Capitalize the first letter of a string
 * @param str - The string to capitalize
 * @returns Capitalized string
 * @example
 * capitalize("hello") // → "Hello"
 */
export function capitalize(str: string): string {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert snake_case or kebab-case to Title Case
 * Commonly used for converting enum or database values to display text
 * @param str - The string to convert
 * @returns Title Case string
 * @example
 * formatEnumValue("in_progress") // → "In Progress"
 * formatEnumValue("high-priority") // → "High Priority"
 * formatEnumValue("HOME_SERVICE") // → "Home Service"
 */
export function formatEnumValue(str: string): string {
  if (!str) return ""
  return str
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

/**
 * Convert a string to sentence case
 * @param str - The string to convert
 * @returns Sentence case string
 * @example
 * sentenceCase("HELLO_WORLD") // → "Hello world"
 */
export function sentenceCase(str: string): string {
  if (!str) return ""
  return capitalize(str.toLowerCase().replace(/[_-]/g, " "))
}

/**
 * Truncate a string to a maximum length with ellipsis
 * @param str - The string to truncate
 * @param maxLength - Maximum length (default: 50)
 * @param ellipsis - Ellipsis string (default: "...")
 * @returns Truncated string
 * @example
 * truncate("Hello World", 5) // → "He..."
 */
export function truncate(
  str: string,
  maxLength: number = 50,
  ellipsis: string = "...",
): string {
  if (!str || str.length <= maxLength) return str
  return str.slice(0, maxLength - ellipsis.length) + ellipsis
}

/**
 * Remove HTML tags from a string
 * @param html - HTML string to clean
 * @returns Plain text without HTML tags
 * @example
 * stripHtml("<p>Hello <b>World</b></p>") // → "Hello World"
 */
export function stripHtml(html: string): string {
  if (!html) return ""
  return html.replace(/<[^>]*>/g, "")
}

/**
 * Extract numbers from a string
 * @param str - The string to extract numbers from
 * @returns Array of numbers found in the string
 * @example
 * extractNumbers("Price: 100 to 200") // → [100, 200]
 */
export function extractNumbers(str: string): number[] {
  if (!str) return []
  const matches = str.match(/\d+/g) || []
  return matches.map(Number)
}

/**
 * Convert array of strings to single string with line breaks
 * @param arr - Array of strings
 * @param separator - Separator between items (default: "\n")
 * @returns String with items separated by line breaks
 */
export function arrayToLines(arr: string[], separator: string = "\n"): string {
  return arr.join(separator)
}

/**
 * Convert line-separated string to array
 * @param str - String with line breaks
 * @param separator - Separator pattern (default: /\r?\n/)
 * @returns Array of strings
 */
export function linesToArray(
  str: string,
  separator: RegExp = /\r?\n/,
): string[] {
  if (!str) return []
  return str.split(separator).filter((line) => line.trim() !== "")
}

/**
 * Create a slug from a string (kebab-case, lowercase)
 * @param str - The string to slugify
 * @returns Slugified string
 * @example
 * slug("Hello World!") // → "hello-world"
 */
export function slug(str: string): string {
  if (!str) return ""
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Pluralize a word (very basic, handles common cases)
 * @param word - The word to pluralize
 * @param count - Number of items (if 1, returns singular)
 * @returns Singular or plural form
 * @example
 * pluralize("item", 1) // → "item"
 * pluralize("item", 2) // → "items"
 */
export function pluralize(word: string, count: number): string {
  if (count === 1) return word
  if (word.endsWith("y")) return word.slice(0, -1) + "ies"
  if (word.endsWith("s") || word.endsWith("x") || word.endsWith("z"))
    return word + "es"
  return word + "s"
}

/**
 * Join array items with "and" before the last item
 * @param items - Array of items
 * @param separator - Separator for all but last (default: ", ")
 * @returns Formatted string with "and"
 * @example
 * joinWithAnd(["apple", "banana", "cherry"]) // → "apple, banana, and cherry"
 */
export function joinWithAnd(
  items: string[],
  separator: string = ", ",
): string {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  if (items.length === 2) return items.join(" and ")
  return items.slice(0, -1).join(separator) + separator + "and " + items.at(-1)
}
