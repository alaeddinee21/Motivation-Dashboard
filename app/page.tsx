"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TodoList } from "@/components/todo-list"
import { MotivationalQuote } from "@/components/motivational-quote"
import { ProductivityTip } from "@/components/productivity-tip"
import { WordOfTheDay } from "@/components/word-of-the-day"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { SettingsDropdown } from "@/components/settings-dropdown"
import { StreakCounter } from "@/components/streak-counter"
import { initIdleDetection } from "@/lib/productivity-store"
import { PomodoroTaskSync } from "@/components/pomodoro-task-sync"

export default function Home() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "afternoon" | "evening" | "night">("morning")
  const [currentTime, setCurrentTime] = useState<string>("")
  const [streak, setStreak] = useState(0)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)

    // Initialize idle detection for productivity tracking
    initIdleDetection()

    // Load streak from localStorage
    const savedStreak = localStorage.getItem("streak")
    if (savedStreak) {
      setStreak(Number.parseInt(savedStreak))
    }

    // Check if user visited yesterday to maintain streak
    const lastVisit = localStorage.getItem("lastVisit")
    const today = new Date().toDateString()

    if (lastVisit) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayString = yesterday.toDateString()

      if (lastVisit === yesterdayString || lastVisit === today) {
        // Streak continues
        if (lastVisit !== today) {
          // If it's a new day, increment streak
          const newStreak = streak + 1
          setStreak(newStreak)
          localStorage.setItem("streak", newStreak.toString())
        }
      } else {
        // Streak broken
        setStreak(1)
        localStorage.setItem("streak", "1")
      }
    } else {
      // First visit
      setStreak(1)
      localStorage.setItem("streak", "1")
    }

    // Save today's visit
    localStorage.setItem("lastVisit", today)
  }, [])

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
      setCurrentTime(formattedTime)

      // Set time of day
      if (hours >= 5 && hours < 12) {
        setTimeOfDay("morning")
      } else if (hours >= 12 && hours < 17) {
        setTimeOfDay("afternoon")
      } else if (hours >= 17 && hours < 21) {
        setTimeOfDay("evening")
      } else {
        setTimeOfDay("night")
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // If not mounted yet, don't render anything to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <main
      className={`min-h-screen bg-cover bg-center transition-all duration-500`}
      style={{
        backgroundImage: `url('/images/${timeOfDay}-${theme === "dark" ? "dark" : "light"}.jpg')`,
      }}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <StreakCounter streak={streak} />

          <div className="flex items-center justify-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="text-xl font-medium tabular-nums">{currentTime}</span>
          </div>

          <SettingsDropdown theme={theme} setTheme={setTheme} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            {/* Todo List moved to the top */}
            <Card className="backdrop-blur-sm bg-background/90 transition-all hover:shadow-lg shadow-md border-opacity-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">To-Do List</CardTitle>
                <CardDescription className="text-muted-foreground/90">Track your tasks for today</CardDescription>
              </CardHeader>
              <CardContent>
                <TodoList />
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-background/90 transition-all hover:shadow-lg shadow-md border-opacity-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">Productivity Tip</CardTitle>
                <CardDescription className="text-muted-foreground/90">Boost your productivity</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductivityTip />
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-background/90 transition-all hover:shadow-lg shadow-md border-opacity-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">Word of the Day</CardTitle>
                <CardDescription className="text-muted-foreground/90">Expand your vocabulary</CardDescription>
              </CardHeader>
              <CardContent>
                <WordOfTheDay />
              </CardContent>
            </Card>

            <PomodoroTaskSync />
          </div>

          <div className="space-y-4">
            <Card className="backdrop-blur-sm bg-background/90 transition-all hover:shadow-lg shadow-md border-opacity-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">Pomodoro Timer</CardTitle>
                <CardDescription className="text-muted-foreground/90">
                  Stay focused with timed work sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PomodoroTimer />
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-background/90 transition-all hover:shadow-lg shadow-md border-opacity-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">Daily Motivation</CardTitle>
                <CardDescription className="text-muted-foreground/90">Start your day with inspiration</CardDescription>
              </CardHeader>
              <CardContent>
                <MotivationalQuote />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

