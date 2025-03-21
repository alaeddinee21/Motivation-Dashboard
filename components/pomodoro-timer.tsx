"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, Coffee, CheckCircle2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { recordPomodoroSession, type TaskTag, useTags, getTagColor } from "@/lib/productivity-store"
import { X } from "lucide-react"

type TimerMode = "work" | "break"

export function PomodoroTimer() {
  const { toast } = useToast()
  const [mode, setMode] = useState<TimerMode>("work")
  const [isActive, setIsActive] = useState(false)
  const [workTime, setWorkTime] = useState(() => {
    // Get from localStorage or default to 25 minutes
    const saved = localStorage.getItem("pomodoroLength")
    return saved ? Number.parseInt(saved) * 60 : 25 * 60
  })
  const breakTime = 5 * 60 // 5 minutes
  const [timeLeft, setTimeLeft] = useState(workTime)
  const [progress, setProgress] = useState(100)
  const [sessionsCompleted, setSessionsCompleted] = useState(() => {
    const saved = localStorage.getItem("pomodoroSessions")
    return saved ? Number.parseInt(saved) : 0
  })
  const [selectedSound, setSelectedSound] = useState(() => {
    const saved = localStorage.getItem("pomodoroSound")
    return saved || "bell-meditation"
  })
  const [selectedTags, setSelectedTags] = useState<TaskTag[]>([])
  const [tagColors, setTagColors] = useState<Record<string, string>>({})
  const { tags } = useTags()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sessionStartTimeRef = useRef<number | null>(null)

  // Add timer persistence variables
  const [lastActiveTime, setLastActiveTime] = useState<number | null>(null)
  const timerStateRef = useRef<{
    mode: TimerMode
    timeLeft: number
    isActive: boolean
    lastUpdated: number
  } | null>(null)

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(`/sounds/${selectedSound}.mp3`)

    // Save sound preference
    localStorage.setItem("pomodoroSound", selectedSound)
  }, [selectedSound])

  // Load and update tag colors
  useEffect(() => {
    const updateTagColors = () => {
      const colors: Record<string, string> = {}
      tags.forEach((tag) => {
        colors[tag] = getTagColor(tag)
      })
      setTagColors(colors)
    }

    updateTagColors()

    // Listen for tag color changes
    window.addEventListener("tag_colors_changed", updateTagColors)

    return () => {
      window.removeEventListener("tag_colors_changed", updateTagColors)
    }
  }, [tags])

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = (e: CustomEvent) => {
      const newWorkTime = e.detail.workTime
      setWorkTime(newWorkTime)
      if (mode === "work" && !isActive) {
        setTimeLeft(newWorkTime)
      }
    }

    window.addEventListener("pomodoro-settings-changed", handleSettingsChange as EventListener)

    return () => {
      window.removeEventListener("pomodoro-settings-changed", handleSettingsChange as EventListener)
    }
  }, [mode, isActive])

  // Reset timer when mode changes
  useEffect(() => {
    const newTime = mode === "work" ? workTime : breakTime
    setTimeLeft(newTime)
    setProgress(100)
    setIsActive(false)
  }, [mode, workTime])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Save timer state to localStorage
  const saveTimerState = () => {
    const timerState = {
      mode,
      timeLeft,
      isActive,
      lastUpdated: Date.now(),
      selectedTags,
    }
    localStorage.setItem("pomodoroTimerState", JSON.stringify(timerState))
    timerStateRef.current = timerState
  }

  // Load timer state from localStorage
  const loadTimerState = () => {
    try {
      const savedState = localStorage.getItem("pomodoroTimerState")
      if (savedState) {
        const parsedState = JSON.parse(savedState)

        // Calculate elapsed time since last update
        const now = Date.now()
        const elapsed = Math.floor((now - parsedState.lastUpdated) / 1000)

        // Only restore if the timer was active and there's time left
        if (parsedState.isActive && parsedState.timeLeft > 0) {
          // Adjust remaining time
          const newTimeLeft = Math.max(0, parsedState.timeLeft - elapsed)

          // If timer should have completed while away, handle completion
          if (newTimeLeft <= 0) {
            // Handle timer completion
            setMode(parsedState.mode === "work" ? "break" : "work")
            setTimeLeft(parsedState.mode === "work" ? breakTime : workTime)
            setIsActive(false)
            setProgress(100)

            // Play completion sound
            if (audioRef.current) {
              audioRef.current.play().catch((e) => console.error("Error playing sound:", e))
            }

            // Record completed session if it was work mode
            if (parsedState.mode === "work" && sessionStartTimeRef.current) {
              const sessionEndTime = Date.now()
              const sessionDuration = Math.round((sessionEndTime - sessionStartTimeRef.current) / 60000)

              recordPomodoroSession({
                id: Date.now().toString(),
                startTime: sessionStartTimeRef.current,
                endTime: sessionEndTime,
                duration: sessionDuration,
                completed: true,
                tags: parsedState.selectedTags?.length > 0 ? parsedState.selectedTags : ["Other"],
              })

              // Reset session start time
              sessionStartTimeRef.current = null
            }
          } else {
            // Continue timer with adjusted time
            setMode(parsedState.mode)
            setTimeLeft(newTimeLeft)
            setIsActive(parsedState.isActive)
            const totalTime = parsedState.mode === "work" ? workTime : breakTime
            setProgress((newTimeLeft / totalTime) * 100)

            // Restore selected tags
            if (parsedState.selectedTags) {
              setSelectedTags(parsedState.selectedTags)
            }
          }
        } else {
          // Timer was paused, just restore state
          setMode(parsedState.mode)
          setTimeLeft(parsedState.timeLeft)
          setIsActive(parsedState.isActive)
          const totalTime = parsedState.mode === "work" ? workTime : breakTime
          setProgress((parsedState.timeLeft / totalTime) * 100)

          // Restore selected tags
          if (parsedState.selectedTags) {
            setSelectedTags(parsedState.selectedTags)
          }
        }
      }
    } catch (error) {
      console.error("Error loading timer state:", error)
    }
  }

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft > 0) {
      // Record session start time when starting a work session
      if (mode === "work" && sessionStartTimeRef.current === null) {
        sessionStartTimeRef.current = Date.now()
      }

      // Save timer state whenever it changes
      saveTimerState()

      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1
          const totalTime = mode === "work" ? workTime : breakTime
          const newProgress = (newTime / totalTime) * 100
          setProgress(newProgress)

          // Save state on each tick
          setTimeout(() => saveTimerState(), 0)

          return newTime
        })
      }, 1000)
    } else if (isActive && timeLeft === 0) {
      // Timer completed
      setIsActive(false)
      saveTimerState()

      // Play sound
      if (audioRef.current) {
        audioRef.current.play().catch((e) => console.error("Error playing sound:", e))
      }

      if (mode === "work") {
        // Record completed Pomodoro session
        if (sessionStartTimeRef.current) {
          const sessionEndTime = Date.now()
          const sessionDuration = Math.round((sessionEndTime - sessionStartTimeRef.current) / 60000) // in minutes

          recordPomodoroSession({
            id: Date.now().toString(),
            startTime: sessionStartTimeRef.current,
            endTime: sessionEndTime,
            duration: sessionDuration,
            completed: true,
            tags: selectedTags.length > 0 ? selectedTags : ["Other"], // Default to 'Other' if no tags
          })

          // Reset session start time
          sessionStartTimeRef.current = null
        }

        // Increment sessions completed
        const newSessions = sessionsCompleted + 1
        setSessionsCompleted(newSessions)
        localStorage.setItem("pomodoroSessions", newSessions.toString())
        window.dispatchEvent(new Event("tasks_updated"))

        // Show achievement toast if milestone reached
        if (newSessions % 5 === 0) {
          toast({
            title: "Achievement Unlocked! 🏆",
            description: `You've completed ${newSessions} Pomodoro sessions!`,
            duration: 5000,
          })
        } else {
          toast({
            title: "Pomodoro Completed! ✅",
            description: "Time for a break!",
            duration: 3000,
          })
        }

        // Switch to break mode
        setMode("break")
      } else {
        // Switch to work mode
        toast({
          title: "Break Completed! 🔄",
          description: "Ready to focus again?",
          duration: 3000,
        })
        setMode("work")
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft, mode, workTime, breakTime, sessionsCompleted, toast, selectedTags])

  // Handle visibility changes (tab switching)
  useEffect(() => {
    // Load timer state on initial mount
    loadTimerState()

    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Tab is now visible, load timer state
        loadTimerState()
      } else {
        // Tab is now hidden, save timer state
        saveTimerState()
      }
    }

    // Add event listener for visibility change
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  const toggleTimer = () => {
    const newIsActive = !isActive
    setIsActive(newIsActive)

    // If starting timer, record the start time
    if (newIsActive && mode === "work" && !sessionStartTimeRef.current) {
      sessionStartTimeRef.current = Date.now()
    }

    // Save timer state
    setTimeout(() => saveTimerState(), 0)
  }

  const resetTimer = () => {
    setIsActive(false)
    const newTime = mode === "work" ? workTime : breakTime
    setTimeLeft(newTime)
    setProgress(100)

    // Reset session start time
    sessionStartTimeRef.current = null

    // Save timer state
    setTimeout(() => saveTimerState(), 0)
  }

  // Calculate stroke dash offset for circular progress
  const calculateStrokeDashoffset = (percent: number) => {
    const circumference = 2 * Math.PI * 45 // radius is 45
    return circumference - (percent / 100) * circumference
  }

  // Add a tag to the session
  const addTag = (tag: TaskTag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  // Remove a tag from the session
  const removeTag = (tag: TaskTag) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="work" onValueChange={(value) => setMode(value as TimerMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger
            value="work"
            disabled={isActive}
            className="text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
          >
            Work
          </TabsTrigger>
          <TabsTrigger
            value="break"
            disabled={isActive}
            className="text-base font-medium data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
          >
            Break
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col items-center space-y-4">
        <div className="relative flex items-center justify-center">
          <svg className="w-56 h-56 transform -rotate-90 drop-shadow-lg">
            <circle
              cx="112"
              cy="112"
              r="104"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted/30"
            />
            <circle
              cx="112"
              cy="112"
              r="104"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 104}
              strokeDashoffset={calculateStrokeDashoffset(progress)}
              className={`${
                mode === "work" ? "text-primary filter drop-shadow-md" : "text-green-500 filter drop-shadow-md"
              } transition-all duration-1000 ease-linear`}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <div className="text-6xl font-bold tabular-nums tracking-tight">{formatTime(timeLeft)}</div>
            <div className="text-sm text-muted-foreground mt-2 font-medium">
              {mode === "work" ? "Focus time" : "Break time"}
            </div>
          </div>
        </div>

        <div className="flex space-x-4 mt-2">
          <Button
            onClick={toggleTimer}
            variant="default"
            size="lg"
            className="transition-all duration-200 active:scale-95 hover:scale-105 hover:shadow-md w-32 h-12 text-base font-medium"
          >
            {isActive ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
            {isActive ? "Pause" : "Start"}
          </Button>
          <Button
            onClick={resetTimer}
            variant="outline"
            size="lg"
            disabled={timeLeft === (mode === "work" ? workTime : breakTime) && !isActive}
            className="transition-all duration-200 active:scale-95 hover:scale-105 hover:shadow-md w-32 h-12 text-base font-medium"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Reset
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          {mode === "work" ? (
            <div className="flex items-center">
              <Coffee className="h-4 w-4 mr-1" />
              Break in {formatTime(timeLeft)}
            </div>
          ) : (
            <div className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Work in {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center mt-4 text-sm font-medium">
          <span className="bg-primary/15 text-primary px-4 py-2 rounded-full text-base font-semibold shadow-sm">
            {sessionsCompleted} session{sessionsCompleted !== 1 ? "s" : ""} completed today
          </span>
        </div>

        <div className="w-full space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Timer Sound</label>
            <Select value={selectedSound} onValueChange={setSelectedSound}>
              <SelectTrigger>
                <SelectValue placeholder="Select sound" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bell-meditation">Meditation Bell</SelectItem>
                <SelectItem value="complete">Completion Chime</SelectItem>
                <SelectItem value="add">Soft Notification</SelectItem>
                <SelectItem value="delete">Alert Sound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Session Tags</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    Add Tag
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {tags.map((tag) => (
                    <DropdownMenuItem key={tag} onClick={() => addTag(tag)} disabled={selectedTags.includes(tag)}>
                      {tag}
                    </DropdownMenuItem>
                  ))}
                  {tags.length === 0 && <DropdownMenuItem disabled>No tags available</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-wrap gap-1 min-h-7 p-1 border rounded-md">
              {selectedTags.length > 0 ? (
                selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs py-0 h-5 px-1.5 flex items-center gap-1"
                    style={{
                      borderColor: tagColors[tag] || "currentColor",
                      backgroundColor: `${tagColors[tag]}20` || "transparent",
                      color: tagColors[tag] || "currentColor",
                    }}
                  >
                    {tag}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-3 w-3 p-0 rounded-full hover:bg-destructive/20"
                      onClick={() => removeTag(tag)}
                      disabled={isActive}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground flex items-center p-1">No tags selected</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

