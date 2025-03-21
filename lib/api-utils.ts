/**
 * Handles API errors and returns a standardized error response
 */
export function handleApiError(error: unknown, fallbackData: any) {
  console.error("API Error:", error)

  return {
    data: fallbackData,
    error: error instanceof Error ? error.message : "An unknown error occurred",
    source: "fallback",
  }
}

/**
 * Generates a consistent random index based on the current date
 * This ensures the same content is shown all day
 */
export function getTodayIndex(array: any[]) {
  const today = new Date().toISOString().split("T")[0]
  const seed = today.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return seed % array.length
}

