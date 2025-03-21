"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Link2, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { syncPomodoroWithTask } from "@/lib/productivity-store"

type Todo = {
  id: string
  text: string
  completed: boolean
  tags: string[]
}

type PomodoroSession = {
  id: string
  startTime: number
  endTime: number
  duration: number
  completed: boolean
  associatedTaskId?: string
  tags: string[]
}

export function PomodoroTaskSync() {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Todo[]>([])
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  const [selectedTask, setSelectedTask] = useState<string>("")
  const [selectedSession, setSelectedSession] = useState<string>("")

  // Load tasks and sessions
  useEffect(() => {
    const loadData = () => {
      try {
        // Load tasks
        const savedTodos = localStorage.getItem("todos")
        if (savedTodos) {
          const parsedTodos = JSON.parse(savedTodos)
          // Only show incomplete tasks
          setTasks(parsedTodos.filter((todo: Todo) => !todo.completed))
        }

        // Load Pomodoro sessions
        const savedSessions = localStorage.getItem("pomodoro_sessions")
        if (savedSessions) {
          const parsedSessions = JSON.parse(savedSessions)
          // Only show completed sessions from today
          const today = new Date().setHours(0, 0, 0, 0)
          setSessions(
            parsedSessions
              .filter((session: PomodoroSession) => {
                const sessionDate = new Date(session.endTime).setHours(0, 0, 0, 0)
                return session.completed && sessionDate >= today && !session.associatedTaskId
              })
              .sort((a: PomodoroSession, b: PomodoroSession) => b.endTime - a.endTime),
          )
        }
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    loadData()

    // Refresh data every minute
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleSync = async () => {
    if (!selectedTask || !selectedSession) {
      toast({
        title: "Selection Required",
        description: "Please select both a task and a Pomodoro session",
        variant: "destructive",
      })
      return
    }

    await syncPomodoroWithTask(selectedSession, selectedTask)

    toast({
      title: "Sync Complete",
      description: "Pomodoro session has been linked to the task",
    })

    // Reset selections and refresh data
    setSelectedTask("")
    setSelectedSession("")

    // Refresh the lists
    const savedTodos = localStorage.getItem("todos")
    if (savedTodos) {
      const parsedTodos = JSON.parse(savedTodos)
      setTasks(parsedTodos.filter((todo: Todo) => !todo.completed))
    }

    const savedSessions = localStorage.getItem("pomodoro_sessions")
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions)
      const today = new Date().setHours(0, 0, 0, 0)
      setSessions(
        parsedSessions
          .filter((session: PomodoroSession) => {
            const sessionDate = new Date(session.endTime).setHours(0, 0, 0, 0)
            return session.completed && sessionDate >= today && !session.associatedTaskId
          })
          .sort((a: PomodoroSession, b: PomodoroSession) => b.endTime - a.endTime),
      )
    }
  }

  // Format time for display
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (sessions.length === 0) {
    return null // Don't show if no sessions to sync
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Link Pomodoro to Task
        </CardTitle>
        <CardDescription>Connect your completed Pomodoro sessions to tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Task</label>
          <Select value={selectedTask} onValueChange={setSelectedTask}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a task" />
            </SelectTrigger>
            <SelectContent>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.text}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  No tasks available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Select Pomodoro Session</label>
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatTime(session.endTime)} - {session.duration} mins
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSync} className="w-full">
          Link Session to Task
        </Button>
      </CardContent>
    </Card>
  )
}

