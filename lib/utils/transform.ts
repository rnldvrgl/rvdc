/**
 * Data transformation utilities
 * Convert between different data formats and structures
 */

/**
 * Try to parse JSON safely, return default on error
 * @param json - JSON string to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed object or default value
 * @example
 * safeJsonParse('{"key": "value"}', {}) // → { key: "value" }
 * safeJsonParse('invalid', null) // → null
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return defaultValue
  }
}

/**
 * Convert object to query string
 * @param obj - Object to convert
 * @returns Query string (e.g., "key1=value1&key2=value2")
 */
export function objectToQueryString(obj: Record<string, unknown>): string {
  const params = new URLSearchParams()
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.set(key, String(value))
    }
  })
  return params.toString()
}

/**
 * Convert query string to object
 * @param queryString - Query string (with or without ?)
 * @returns Object with key-value pairs
 */
export function queryStringToObject(
  queryString: string,
): Record<string, string> {
  const params = new URLSearchParams(
    queryString.startsWith("?") ? queryString.slice(1) : queryString,
  )
  const obj: Record<string, string> = {}
  params.forEach((value, key) => {
    obj[key] = value
  })
  return obj
}

/**
 * Group array items by a key function
 * @param array - Array to group
 * @param keyFn - Function to extract grouping key
 * @returns Object with grouped items
 * @example
 * groupBy([{type: 'a', val: 1}, {type: 'b', val: 2}], item => item.type)
 * // → { a: [{type: 'a', val: 1}], b: [{type: 'b', val: 2}] }
 */
export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  return array.reduce(
    (acc, item) => {
      const key = keyFn(item)
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    },
    {} as Record<K, T[]>,
  )
}

/**
 * Create a map from array using a key function
 * @param array - Array to map
 * @param keyFn - Function to extract map key
 * @returns Map with array items keyed by key function result
 */
export function arrayToMap<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K,
): Map<K, T> {
  const map = new Map<K, T>()
  array.forEach((item) => {
    map.set(keyFn(item), item)
  })
  return map
}

/**
 * Flatten an array of arrays
 * @param array - Array containing arrays
 * @returns Flattened array
 * @example
 * flatten([[1, 2], [3, 4]]) // → [1, 2, 3, 4]
 */
export function flatten<T>(array: T[][]): T[] {
  return array.reduce((acc, arr) => [...acc, ...arr], [])
}

/**
 * Create an array of unique values
 * @param array - Array to deduplicate
 * @param keyFn - Optional function to extract comparison key
 * @returns Array with unique values
 */
export function unique<T, K = T>(array: T[], keyFn?: (item: T) => K): T[] {
  if (!keyFn) {
    return [...new Set(array)]
  }

  const seen = new Set<K>()
  return array.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Paginate an array
 * @param array - Array to paginate
 * @param pageNumber - Page number (1-indexed)
 * @param pageSize - Items per page
 * @returns Paginated array
 * @example
 * paginate([1,2,3,4,5], 2, 2) // → [3, 4]
 */
export function paginate<T>(
  array: T[],
  pageNumber: number,
  pageSize: number,
): T[] {
  const startIndex = (pageNumber - 1) * pageSize
  return array.slice(startIndex, startIndex + pageSize)
}

/**
 * Create a paginated response object
 * @param array - Array to paginate
 * @param pageNumber - Current page number
 * @param pageSize - Items per page
 * @returns Pagination object with data and metadata
 */
export function createPaginatedResponse<T>(
  array: T[],
  pageNumber: number,
  pageSize: number,
): {
  data: T[]
  page: number
  pageSize: number
  total: number
  pages: number
} {
  const total = array.length
  const pages = Math.ceil(total / pageSize)
  const data = paginate(array, pageNumber, pageSize)

  return { data, page: pageNumber, pageSize, total, pages }
}

/**
 * Sort array by multiple keys
 * @param array - Array to sort
 * @param sortBy - Array of sort specifications
 * @returns Sorted array
 * @example
 * sortByMultiple(users, [{key: 'last_name'}, {key: 'first_name'}])
 */
export function sortByMultiple<T>(
  array: T[],
  sortBy: Array<{ key: keyof T; order?: "asc" | "desc" }>,
): T[] {
  return [...array].sort((a, b) => {
    for (const { key, order = "asc" } of sortBy) {
      const aVal = a[key]
      const bVal = b[key]

      if (aVal === bVal) continue

      const comparison = aVal < bVal ? -1 : 1
      return order === "asc" ? comparison : -comparison
    }
    return 0
  })
}

/**
 * Pick specific keys from an object
 * @param obj - Object to pick from
 * @param keys - Keys to pick
 * @returns New object with only picked keys
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

/**
 * Omit specific keys from an object
 * @param obj - Object to omit from
 * @param keys - Keys to omit
 * @returns New object without omitted keys
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> {
  const keySet = new Set(keys)
  const result = {} as Omit<T, K>
  Object.entries(obj).forEach(([key, value]) => {
    if (!keySet.has(key as K)) {
      ;(result as Record<string, unknown>)[key] = value
    }
  })
  return result
}

/**
 * Merge multiple objects deeply
 * @param objects - Objects to merge
 * @returns Merged object
 */
export function deepMerge<T extends object>(...objects: Partial<T>[]): T {
  const result = {} as T

  objects.forEach((obj) => {
    Object.entries(obj).forEach(([key, value]) => {
      const existingValue = (result as Record<string, unknown>)[key]

      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        existingValue &&
        typeof existingValue === "object" &&
        !Array.isArray(existingValue)
      ) {
        ;(result as Record<string, unknown>)[key] = deepMerge(
          existingValue as object,
          value as object,
        )
      } else {
        ;(result as Record<string, unknown>)[key] = value
      }
    })
  })

  return result
}
