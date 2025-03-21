"use client"

import { useEffect, useState } from "react"
import { BookOpen, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type WordType = {
  word: string
  definition: string
  example: string
}

// Fallback words in case API fails
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

export function WordOfTheDay() {
  const [wordOfDay, setWordOfDay] = useState<WordType>({ word: "", definition: "", example: "" })
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchWord = async () => {
    setIsLoading(true)
    setIsVisible(false)

    try {
      const response = await fetch("/api/word")

      if (!response.ok) {
        throw new Error("Failed to fetch word")
      }

      const data = await response.json()
      setWordOfDay(data)
    } catch (error) {
      console.error("Error fetching word of the day:", error)

      // Use today's date to get a consistent word for the day from fallback
      const today = new Date().toISOString().split("T")[0]
      const seed = today.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const index = seed % fallbackWords.length

      setWordOfDay(fallbackWords[index])
    } finally {
      setIsLoading(false)

      // Animate in after a short delay
      setTimeout(() => {
        setIsVisible(true)
      }, 300)
    }
  }

  useEffect(() => {
    fetchWord()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse h-6 bg-muted rounded-md w-1/3 mb-3"></div>
        <div className="animate-pulse h-4 bg-muted rounded-md w-full mb-2"></div>
        <div className="animate-pulse h-4 bg-muted rounded-md w-3/4"></div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        className={`space-y-3 transition-all duration-700 ease-in-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex items-center">
          <BookOpen className="h-6 w-6 mr-2 text-primary" />
          <h3 className="text-xl font-semibold">{wordOfDay.word}</h3>
        </div>
        <p className="text-base">{wordOfDay.definition}</p>
        <p className="text-sm text-muted-foreground italic">"{wordOfDay.example}"</p>
      </div>

      <div className="flex justify-end mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchWord}
          disabled={isLoading}
          className="text-xs text-muted-foreground hover:text-foreground transition-all hover:bg-accent/10 hover:scale-105"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          New Word
        </Button>
      </div>
    </div>
  )
}

