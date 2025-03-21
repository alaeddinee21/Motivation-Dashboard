"use client"

// Types for our productivity data
export type TaskTag = string
export type TaskCategory = string

// Default categories
export const DEFAULT_CATEGORIES: TaskCategory[] = ["Deep Work", "Meetings", "Learning", "Admin", "Other"]

// Productivity data storage utility using localStorage
import { useEffect, useState } from "react"

export interface TaskData {
  id: string
  text: string
  tags: TaskTag[]
  timeSpent: number // in minutes
  completed: boolean
  completedAt?: number
  createdAt: number
}

export interface PomodoroSession {
  id: string
  startTime: number
  endTime: number
  duration: number // in minutes
  completed: boolean
  associatedTaskId?: string
  tags: TaskTag[]
}

export interface ProductivityData {
  date: string // YYYY-MM-DD format
  totalTasksCompleted: number
  totalPomodoroCompleted: number
  totalTimeSpent: number // in minutes
  taskTimeByTag: Record<TaskTag, number> // in minutes
  idleTime: number // in minutes
}

// Default tags
export const DEFAULT_TAGS: TaskTag[] = ["Deep Work", "Meetings", "Learning", "Admin", "Other"]

// Helper to get today's date in YYYY-MM-DD format
export const getTodayDateString = (): string => {
  const today = new Date()
  return today.toISOString().split("T")[0]
}

// Helper to get date range for weekly and monthly views
export const getDateRange = (range: "day" | "week" | "month"): string[] => {
  const dates: string[] = []
  const today = new Date()

  if (range === "day") {
    return [getTodayDateString()]
  }

  const daysToInclude = range === "week" ? 7 : 30

  for (let i = 0; i < daysToInclude; i++) {
    const date = new Date()
    date.setDate(today.getDate() - i)
    dates.push(date.toISOString().split("T")[0])
  }

  return dates.reverse()
}

// Get all available tags
export const getAllTags = (): TaskTag[] => {
  try {
    const storedTags = localStorage.getItem("productivity_tags")
    if (storedTags) {
      return JSON.parse(storedTags)
    }

    // Initialize with default tags if none exist
    localStorage.setItem("productivity_tags", JSON.stringify(DEFAULT_TAGS))
    return DEFAULT_TAGS
  } catch (error) {
    console.error("Error getting tags:", error)
    return DEFAULT_TAGS
  }
}

// Add a new tag
export const addTag = (tag: TaskTag): void => {
  try {
    const currentTags = getAllTags()
    if (!currentTags.includes(tag)) {
      const updatedTags = [...currentTags, tag]
      localStorage.setItem("productivity_tags", JSON.stringify(updatedTags))
    }
  } catch (error) {
    console.error("Error adding tag:", error)
  }
}

// Remove a tag
export const removeTag = (tag: TaskTag): void => {
  try {
    const currentTags = getAllTags()
    const updatedTags = currentTags.filter((t) => t !== tag)
    localStorage.setItem("productivity_tags", JSON.stringify(updatedTags))

    // Note: We don't remove the tag from historical data
    // This allows for consistent reporting even if tags are removed
  } catch (error) {
    console.error("Error removing tag:", error)
  }
}

// Get tag color
export const getTagColor = (tag: TaskTag): string => {
  try {
    const storedColors = localStorage.getItem("productivity_tag_colors")
    if (storedColors) {
      const colors = JSON.parse(storedColors)
      return colors[tag] || getDefaultTagColor(tag)
    }
    return getDefaultTagColor(tag)
  } catch (error) {
    console.error("Error getting tag color:", error)
    return getDefaultTagColor(tag)
  }
}

// Set tag color
export const setTagColor = (tag: TaskTag, color: string): void => {
  try {
    const storedColors = localStorage.getItem("productivity_tag_colors") || "{}"
    const colors = JSON.parse(storedColors)
    colors[tag] = color
    localStorage.setItem("productivity_tag_colors", JSON.stringify(colors))

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent("tag_colors_changed"))
  } catch (error) {
    console.error("Error setting tag color:", error)
  }
}

// Get a default color for a tag based on its name
export const getDefaultTagColor = (tag: TaskTag): string => {
  // Default colors
  const colors = [
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#10b981", // Green
    "#f59e0b", // Amber
    "#6b7280", // Gray
    "#ef4444", // Red
    "#0ea5e9", // Sky
    "#a855f7", // Violet
    "#eab308", // Yellow
    "#ec4899", // Pink
  ]

  // Generate a consistent index based on the tag name
  const index = tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  return colors[index]
}

// Initialize or get productivity data for a specific date
export const getOrCreateProductivityData = async (date: string): Promise<ProductivityData> => {
  try {
    // Using localStorage as specified
    const storedData = localStorage.getItem(`productivity_${date}`)

    if (storedData) {
      const parsedData = JSON.parse(storedData)

      // Ensure taskTimeByTag exists
      if (!parsedData.taskTimeByTag) {
        parsedData.taskTimeByTag = {}
      }

      return parsedData
    }

    // Create new data if none exists
    const tags = getAllTags()
    const taskTimeByTag: Record<TaskTag, number> = {}

    // Initialize all tags with zero time
    tags.forEach((tag) => {
      taskTimeByTag[tag] = 0
    })

    const newData: ProductivityData = {
      date,
      totalTasksCompleted: 0,
      totalPomodoroCompleted: 0,
      totalTimeSpent: 0,
      taskTimeByTag,
      idleTime: 0,
    }

    localStorage.setItem(`productivity_${date}`, JSON.stringify(newData))
    return newData
  } catch (error) {
    console.error("Error accessing productivity data:", error)
    // Return default data if there's an error
    return {
      date,
      totalTasksCompleted: 0,
      totalPomodoroCompleted: 0,
      totalTimeSpent: 0,
      taskTimeByTag: {},
      idleTime: 0,
    }
  }
}

// Update productivity data
export const updateProductivityData = async (date: string, data: Partial<ProductivityData>): Promise<void> => {
  try {
    const currentData = await getOrCreateProductivityData(date)
    const updatedData = { ...currentData, ...data }
    localStorage.setItem(`productivity_${date}`, JSON.stringify(updatedData))
  } catch (error) {
    console.error("Error updating productivity data:", error)
  }
}

// Record a completed Pomodoro session
export const recordPomodoroSession = async (session: PomodoroSession): Promise<void> => {
  try {
    const date = new Date(session.endTime).toISOString().split("T")[0]
    const currentData = await getOrCreateProductivityData(date)

    if (session.completed) {
      currentData.totalPomodoroCompleted += 1
      currentData.totalTimeSpent += session.duration

      // Update time for each tag
      session.tags.forEach((tag) => {
        // Ensure the tag exists in the data
        if (currentData.taskTimeByTag[tag] === undefined) {
          currentData.taskTimeByTag[tag] = 0
        }

        // Add time to the tag
        currentData.taskTimeByTag[tag] += session.duration / session.tags.length
      })

      // If no tags, add to "Other"
      if (session.tags.length === 0) {
        if (currentData.taskTimeByTag["Other"] === undefined) {
          currentData.taskTimeByTag["Other"] = 0
        }
        currentData.taskTimeByTag["Other"] += session.duration
      }
    }

    await updateProductivityData(date, currentData)

    // Store the session itself
    const sessionsString = localStorage.getItem("pomodoro_sessions") || "[]"
    const sessions: PomodoroSession[] = JSON.parse(sessionsString)
    sessions.push(session)
    localStorage.setItem("pomodoro_sessions", JSON.stringify(sessions))
  } catch (error) {
    console.error("Error recording Pomodoro session:", error)
  }
}

// Record a completed task
export const recordTaskCompletion = async (task: TaskData): Promise<void> => {
  try {
    const date = new Date().toISOString().split("T")[0]
    const currentData = await getOrCreateProductivityData(date)

    currentData.totalTasksCompleted += 1

    // Use the actual time spent from the task
    const timeSpent = task.timeSpent || 0
    currentData.totalTimeSpent += timeSpent

    // Update time for each tag
    task.tags.forEach((tag) => {
      // Ensure the tag exists in the data
      if (currentData.taskTimeByTag[tag] === undefined) {
        currentData.taskTimeByTag[tag] = 0
      }

      // Add time to the tag - distribute evenly across tags
      const timePerTag = task.tags.length > 0 ? timeSpent / task.tags.length : timeSpent
      currentData.taskTimeByTag[tag] += timePerTag
    })

    // If no tags, add to "Other"
    if (task.tags.length === 0) {
      if (currentData.taskTimeByTag["Other"] === undefined) {
        currentData.taskTimeByTag["Other"] = 0
      }
      currentData.taskTimeByTag["Other"] += timeSpent
    }

    await updateProductivityData(date, currentData)

    // Store the task itself for history
    const tasksString = localStorage.getItem("completed_tasks") || "[]"
    const tasks: TaskData[] = JSON.parse(tasksString)
    tasks.push(task)
    localStorage.setItem("completed_tasks", JSON.stringify(tasks))
  } catch (error) {
    console.error("Error recording task completion:", error)
  }
}

// Add this function to sync Pomodoro sessions with tasks
export const syncPomodoroWithTask = async (sessionId: string, taskId: string): Promise<void> => {
  try {
    // Get the Pomodoro session
    const sessionsString = localStorage.getItem("pomodoro_sessions") || "[]"
    const sessions: PomodoroSession[] = JSON.parse(sessionsString)
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId)

    if (sessionIndex >= 0) {
      // Update the session with the task ID
      sessions[sessionIndex].associatedTaskId = taskId
      localStorage.setItem("pomodoro_sessions", JSON.stringify(sessions))

      // Get the task
      const tasksString = localStorage.getItem("todos") || "[]"
      const tasks: TaskData[] = JSON.parse(tasksString)
      const taskIndex = tasks.findIndex((t) => t.id === taskId)

      if (taskIndex >= 0) {
        // Update the task with the session's time
        const sessionDuration = sessions[sessionIndex].duration
        tasks[taskIndex].timeSpent += sessionDuration
        localStorage.setItem("todos", JSON.stringify(tasks))
      }
    }
  } catch (error) {
    console.error("Error syncing Pomodoro with task:", error)
  }
}

// Add this function to get the active Pomodoro session
export const getActivePomodoro = (): PomodoroSession | null => {
  try {
    const timerState = localStorage.getItem("pomodoroTimerState")
    if (!timerState) return null

    const parsedState = JSON.parse(timerState)
    if (!parsedState.isActive || parsedState.mode !== "work") return null

    // Create a temporary session object
    return {
      id: "active-session",
      startTime: parsedState.startTime || Date.now() - (parsedState.workTime - parsedState.timeLeft) * 1000,
      endTime: 0, // Not ended yet
      duration: Math.round((parsedState.workTime - parsedState.timeLeft) / 60),
      completed: false,
      tags: parsedState.selectedTags || [],
    }
  } catch (error) {
    console.error("Error getting active Pomodoro:", error)
    return null
  }
}

// Get productivity data for a date range
export const getProductivityDataRange = async (range: "day" | "week" | "month"): Promise<ProductivityData[]> => {
  try {
    const dates = getDateRange(range)
    const dataPromises = dates.map((date) => getOrCreateProductivityData(date))
    return await Promise.all(dataPromises)
  } catch (error) {
    console.error("Error getting productivity data range:", error)
    return []
  }
}

// Get all Pomodoro sessions
export const getAllPomodoroSessions = (): PomodoroSession[] => {
  try {
    const sessionsString = localStorage.getItem("pomodoro_sessions") || "[]"
    return JSON.parse(sessionsString)
  } catch (error) {
    console.error("Error getting Pomodoro sessions:", error)
    return []
  }
}

// Get all tasks
export const getAllTasks = (): TaskData[] => {
  try {
    const tasksString = localStorage.getItem("tasks") || "[]"
    return JSON.parse(tasksString)
  } catch (error) {
    console.error("Error getting tasks:", error)
    return []
  }
}

// Filter Pomodoro sessions by tag
export const filterPomodoroSessionsByTag = (tag: TaskTag): PomodoroSession[] => {
  const sessions = getAllPomodoroSessions()
  return sessions.filter((session) => session.tags.includes(tag))
}

// Filter tasks by tag
export const filterTasksByTag = (tag: TaskTag): TaskData[] => {
  const tasks = getAllTasks()
  return tasks.filter((task) => task.tags.includes(tag))
}

// Get all completed tasks
export const getCompletedTasks = (): TaskData[] => {
  try {
    // First check the completed_tasks storage
    const completedTasksString = localStorage.getItem("completed_tasks") || "[]"
    const completedTasks = JSON.parse(completedTasksString)

    // Also check the todos storage for completed tasks
    const todosString = localStorage.getItem("todos") || "[]"
    const todos = JSON.parse(todosString)
    const completedTodos = todos.filter((todo: TaskData) => todo.completed)

    // Combine both sources, removing duplicates by ID
    const allTasks = [...completedTasks, ...completedTodos]
    const uniqueTasks = allTasks.reduce((acc: TaskData[], task: TaskData) => {
      if (!acc.some((t) => t.id === task.id)) {
        acc.push(task)
      }
      return acc
    }, [])

    return uniqueTasks
  } catch (error) {
    console.error("Error getting completed tasks:", error)
    return []
  }
}

// Add this function to filter tasks by date range
export const getTasksByDateRange = (range: "day" | "week" | "month"): TaskData[] => {
  const tasks = getCompletedTasks()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

  let startDate: number

  switch (range) {
    case "day":
      startDate = today
      break
    case "week":
      startDate = today - 6 * 24 * 60 * 60 * 1000 // 7 days including today
      break
    case "month":
      startDate = today - 29 * 24 * 60 * 60 * 1000 // 30 days including today
      break
    default:
      startDate = today
  }

  return tasks.filter((task) => {
    // Use completedAt if available, otherwise use createdAt
    const taskDate = task.completedAt || task.createdAt
    return taskDate >= startDate
  })
}

// Add this function to get top tasks by time spent
export const getTopTasksByTimeSpent = (range: "day" | "week" | "month", tag?: TaskTag, limit = 5): TaskData[] => {
  let tasks = getTasksByDateRange(range)

  // Filter by tag if provided
  if (tag) {
    tasks = tasks.filter((task) => task.tags.includes(tag))
  }

  // Sort by time spent (descending)
  tasks.sort((a, b) => b.timeSpent - a.timeSpent)

  // Return top N tasks
  return tasks.slice(0, limit)
}

// Custom hook to access productivity data
export function useProductivityData(range: "day" | "week" | "month" = "day") {
  const [data, setData] = useState<ProductivityData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const result = await getProductivityDataRange(range)
      setData(result)
      setLoading(false)
    }

    fetchData()
  }, [range])

  return { data, loading }
}

// Custom hook to access tags
export function useTags() {
  const [tags, setTags] = useState<TaskTag[]>([])

  useEffect(() => {
    setTags(getAllTags())

    // Listen for tag changes
    const handleTagChange = () => {
      setTags(getAllTags())
    }

    window.addEventListener("productivity_tags_changed", handleTagChange)

    return () => {
      window.removeEventListener("productivity_tags_changed", handleTagChange)
    }
  }, [])

  const addNewTag = (tag: TaskTag) => {
    addTag(tag)
    setTags(getAllTags())
    window.dispatchEvent(new Event("productivity_tags_changed"))
  }

  const removeExistingTag = (tag: TaskTag) => {
    removeTag(tag)
    setTags(getAllTags())
    window.dispatchEvent(new Event("productivity_tags_changed"))
  }

  return { tags, addTag: addNewTag, removeTag: removeExistingTag }
}

// Detect idle time
let lastActivityTime = Date.now()
let idleDetectionEnabled = true

export const enableIdleDetection = (enabled: boolean) => {
  idleDetectionEnabled = enabled
  if (enabled) {
    lastActivityTime = Date.now()
  }
}

// Record user activity
export const recordUserActivity = () => {
  lastActivityTime = Date.now()
}

// Check for idle time (call this periodically)
export const checkIdleTime = async () => {
  if (!idleDetectionEnabled) return

  const now = Date.now()
  const idleThreshold = 5 * 60 * 1000 // 5 minutes in milliseconds

  if (now - lastActivityTime > idleThreshold) {
    const idleMinutes = Math.floor((now - lastActivityTime) / 60000)
    const date = new Date().toISOString().split("T")[0]
    const currentData = await getOrCreateProductivityData(date)

    currentData.idleTime += idleMinutes

    await updateProductivityData(date, currentData)

    // Reset the timer
    lastActivityTime = now
  }
}

// Initialize idle detection
export const initIdleDetection = () => {
  if (typeof window !== "undefined") {
    // Record activity on user interactions
    const events = ["mousedown", "keypress", "scroll", "touchstart"]
    events.forEach((event) => {
      window.addEventListener(event, recordUserActivity)
    })

    // Check for idle time every minute
    setInterval(checkIdleTime, 60000)
  }
}

// Export data as JSON
export const exportProductivityData = (): string => {
  try {
    const data = {
      productivityData: {},
      pomodoroSessions: getAllPomodoroSessions(),
      tasks: getAllTasks(),
      tags: getAllTags(),
      tagColors: localStorage.getItem("productivity_tag_colors")
        ? JSON.parse(localStorage.getItem("productivity_tag_colors") || "{}")
        : {},
      exportDate: new Date().toISOString(),
    }

    // Get all productivity data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("productivity_") && !key.endsWith("_tags")) {
        const value = localStorage.getItem(key)
        if (value) {
          data.productivityData[key] = JSON.parse(value)
        }
      }
    }

    return JSON.stringify(data, null, 2)
  } catch (error) {
    console.error("Error exporting data:", error)
    return JSON.stringify({ error: "Failed to export data" })
  }
}

// Import data from JSON
export const importProductivityData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData)

    // Validate data structure
    if (!data.productivityData || !data.pomodoroSessions || !data.tasks || !data.tags) {
      throw new Error("Invalid data structure")
    }

    // Import tags
    localStorage.setItem("productivity_tags", JSON.stringify(data.tags))

    // Import tag colors if available
    if (data.tagColors) {
      localStorage.setItem("productivity_tag_colors", JSON.stringify(data.tagColors))
    }

    // Import Pomodoro sessions
    localStorage.setItem("pomodoro_sessions", JSON.stringify(data.pomodoroSessions))

    // Import tasks
    localStorage.setItem("tasks", JSON.stringify(data.tasks))

    // Import productivity data
    Object.entries(data.productivityData).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value))
    })

    // Trigger events to update UI
    window.dispatchEvent(new Event("productivity_tags_changed"))

    return true
  } catch (error) {
    console.error("Error importing data:", error)
    return false
  }
}

