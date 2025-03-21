import { NextResponse } from "next/server"
import { getTodayIndex } from "@/lib/api-utils"

// Fallback words if API fails
const fallbackWords = [
  {
    word: "Serendipity",
    definition: "The occurrence of events by chance in a happy or beneficial way.",
    example: "A fortunate serendipity brought them together.",
  },
  {
    word: "Perseverance",
    definition: "Persistence in doing something despite difficulty or delay in achieving success.",
    example: "Her perseverance was finally rewarded with a promotion.",
  },
  {
    word: "Resilience",
    definition: "The capacity to recover quickly from difficulties; toughness.",
    example: "The resilience of the human spirit is remarkable.",
  },
  {
    word: "Mindfulness",
    definition: "The quality or state of being conscious or aware of something.",
    example: "Mindfulness meditation can reduce stress and anxiety.",
  },
  {
    word: "Gratitude",
    definition: "The quality of being thankful; readiness to show appreciation.",
    example: "He expressed his gratitude for their support during difficult times.",
  },
]

// Word of the day API
export async function GET() {
  try {
    // Try to fetch from an external API
    // For a real word of the day, we'll use a list of enriching vocabulary words
    const enrichingWords = [
      "serendipity",
      "perseverance",
      "resilience",
      "mindfulness",
      "gratitude",
      "tenacity",
      "equanimity",
      "diligence",
      "sagacity",
      "fortitude",
      "eloquence",
      "integrity",
      "empathy",
      "innovation",
      "tranquility",
    ]

    // Get a word based on today's date for consistency
    const wordIndex = getTodayIndex(enrichingWords)
    const wordToFetch = enrichingWords[wordIndex]

    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${wordToFetch}`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    if (!response.ok) {
      throw new Error("Failed to fetch word")
    }

    const data = await response.json()

    // Find a definition with an example if possible
    let definition = data[0].meanings[0].definitions[0]
    for (const meaning of data[0].meanings) {
      for (const def of meaning.definitions) {
        if (def.example) {
          definition = def
          break
        }
      }
    }

    return NextResponse.json({
      word: data[0].word,
      definition: definition.definition,
      example: definition.example || `The word "${data[0].word}" enriches our vocabulary.`,
      source: "api",
    })
  } catch (error) {
    // Use our utility function to handle the error
    const fallbackIndex = getTodayIndex(fallbackWords)
    const fallbackWord = fallbackWords[fallbackIndex]

    return NextResponse.json({
      ...fallbackWord,
      source: "fallback",
    })
  }
}

