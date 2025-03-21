"use client"

import { useEffect, useState } from "react"
import { Quote, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type QuoteType = {
  text: string
  author: string
}

// Fallback quotes in case API fails
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

export function MotivationalQuote() {
  const [quote, setQuote] = useState<QuoteType>({ text: "", author: "" })
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchQuote = async () => {
    setIsLoading(true)
    setIsVisible(false)

    try {
      const response = await fetch("/api/quote")

      if (!response.ok) {
        throw new Error("Failed to fetch quote")
      }

      const data = await response.json()
      setQuote(data)
    } catch (error) {
      console.error("Error fetching quote:", error)

      // Use today's date to get a consistent quote for the day from fallback
      const today = new Date().toISOString().split("T")[0]
      const seed = today.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const index = seed % fallbackQuotes.length

      setQuote(fallbackQuotes[index])
    } finally {
      setIsLoading(false)

      // Animate in after a short delay
      setTimeout(() => {
        setIsVisible(true)
      }, 300)
    }
  }

  useEffect(() => {
    fetchQuote()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse h-6 bg-muted rounded-md w-3/4 mb-2"></div>
        <div className="animate-pulse h-6 bg-muted rounded-md w-full"></div>
        <div className="animate-pulse h-4 bg-muted rounded-md w-1/3 ml-auto mt-2"></div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        className={`flex flex-col space-y-3 transition-opacity duration-700 ease-in-out ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-start">
          <Quote className="h-6 w-6 mr-2 text-primary shrink-0 mt-1" />
          <p className="text-xl font-medium italic leading-relaxed">{quote.text}</p>
        </div>
        <p className="text-sm text-muted-foreground text-right">— {quote.author}</p>
      </div>

      <div className="flex justify-end mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchQuote}
          disabled={isLoading}
          className="text-xs text-muted-foreground hover:text-foreground transition-all hover:bg-accent/10 hover:scale-105"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          New Quote
        </Button>
      </div>
    </div>
  )
}

