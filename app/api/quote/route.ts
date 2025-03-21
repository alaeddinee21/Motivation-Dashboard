import { NextResponse } from "next/server"
import { getTodayIndex } from "@/lib/api-utils"

// Fallback quotes if API fails
const fallbackQuotes = [
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
  },
  {
    text: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius",
  },
  {
    text: "Success is not final, failure is not fatal: It is the courage to continue that counts.",
    author: "Winston Churchill",
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
  },
]

// Inspirational quotes API
export async function GET() {
  try {
    // Try to fetch from an external API
    const response = await fetch("https://api.quotable.io/random?tags=inspirational,motivational,success", {
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    if (!response.ok) {
      throw new Error("Failed to fetch quote")
    }

    const data = await response.json()

    return NextResponse.json({
      text: data.content,
      author: data.author,
      source: "api",
    })
  } catch (error) {
    // Use our utility function to handle the error
    const fallbackIndex = getTodayIndex(fallbackQuotes)
    const fallbackQuote = fallbackQuotes[fallbackIndex]

    return NextResponse.json({
      ...fallbackQuote,
      source: "fallback",
    })
  }
}

