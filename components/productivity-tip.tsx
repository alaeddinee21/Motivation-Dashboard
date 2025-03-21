"use client"

import { useEffect, useState } from "react"
import { Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"

// Fallback tips in case API fails
const fallbackTips = [
  "Use the 2-minute rule: If a task takes less than 2 minutes, do it now.",
  "Try the Pomodoro Technique: Work for 25 minutes, then take a 5-minute break.",
  "Plan tomorrow's tasks at the end of today.",
  "Tackle your most challenging task first thing in the morning.",
  "Batch similar tasks together to minimize context switching.",
  "Take short breaks to maintain focus and prevent burnout.",
  "Use the 80/20 rule: Focus on the 20% of tasks that yield 80% of results.",
  "Set specific goals for each work session.",
  "Minimize distractions by silencing notifications during focused work.",
  "Stay hydrated and take short walks to boost productivity.",
]

export function ProductivityTip() {
  const [tip, setTip] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  // Get a tip from the API
  const fetchTip = async () => {
    setIsLoading(true)
    setIsVisible(false)

    try {
      const response = await fetch("/api/tip")

      if (!response.ok) {
        throw new Error("Failed to fetch tip")
      }

      const data = await response.json()
      setTip(data.tip)
    } catch (error) {
      console.error("Error fetching productivity tip:", error)

      // Use a random fallback tip
      const randomIndex = Math.floor(Math.random() * fallbackTips.length)
      setTip(fallbackTips[randomIndex])
    } finally {
      setIsLoading(false)

      // Animate in after a short delay
      setTimeout(() => {
        setIsVisible(true)
      }, 100)
    }
  }

  useEffect(() => {
    fetchTip()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-start min-h-[80px]">
        <Lightbulb className="h-6 w-6 mr-2 text-yellow-500 dark:text-yellow-400 shrink-0 mt-1" />
        {isLoading ? (
          <div className="animate-pulse w-full">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        ) : (
          <p className={`text-base transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            {tip}
          </p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={fetchTip}
        disabled={isLoading}
        className="w-full transition-transform hover:scale-105 active:scale-95 hover:shadow-sm hover:border-primary/50"
      >
        {isLoading ? "Loading..." : "New Tip"}
      </Button>
    </div>
  )
}

