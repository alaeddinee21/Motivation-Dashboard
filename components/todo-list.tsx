"use client"

import { useState, useEffect, useRef } from "react"
import { Check, Plus, Trash, Trophy, Tag, X, Clock, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { type TaskTag, recordTaskCompletion, useTags, getTagColor } from "@/lib/productivity-store"

type Todo = {
  id: string
  text: string
  completed: boolean
  createdAt: number
  tags: TaskTag[]
  timeSpent: number // in minutes
}

export function TodoList() {
  const { toast } = useToast()
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [completedToday, setCompletedToday] = useState(0)
  const [tagColors, setTagColors] = useState<Record<string, string>>({})
  const { tags } = useTags()

  const [activeTask, setActiveTask] = useState<string | null>(null)
  const taskTimersRef = useRef<Record<string, { startTime: number; totalTime: number }>>({})

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem("todos")
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos)
        setTodos(migrateTodos(parsedTodos))
      } catch (error) {
        console.error("Error parsing todos:", error)
        setTodos([])
      }
    }

    // Count completed todos for today
    const today = new Date().setHours(0, 0, 0, 0)
    const savedCompletedToday = localStorage.getItem("completedToday")
    const savedCompletedDate = localStorage.getItem("completedDate")

    if (savedCompletedToday && savedCompletedDate && Number.parseInt(savedCompletedDate) === today) {
      setCompletedToday(Number.parseInt(savedCompletedToday))
    } else {
      // Reset counter for new day
      setCompletedToday(0)
      localStorage.setItem("completedToday", "0")
      localStorage.setItem("completedDate", today.toString())
    }
  }, [])

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos))

    // Dispatch an event to notify other components that tasks have been updated
    window.dispatchEvent(new Event("tasks_updated"))
  }, [todos])

  // Save completed count
  useEffect(() => {
    localStorage.setItem("completedToday", completedToday.toString())
  }, [completedToday])

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

  // Migrate old todos to use tags instead of categories
  const migrateTodos = (todos: any[]): Todo[] => {
    return todos.map((todo) => {
      // If todo has category but no tags
      if (todo.category && !todo.tags) {
        return {
          ...todo,
          tags: [todo.category],
          category: undefined,
        }
      }

      // If todo has no tags
      if (!todo.tags) {
        return {
          ...todo,
          tags: [],
        }
      }

      return todo
    })
  }

  const addTodo = () => {
    if (newTodo.trim() === "") return

    const todo: Todo = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false,
      createdAt: Date.now(),
      tags: [],
      timeSpent: 0,
    }

    // Add with animation by adding class
    setTodos([...todos, todo])
    setNewTodo("")

    // Play sound effect
    const audio = new Audio("/sounds/add.mp3")
    audio.volume = 0.5
    audio.play().catch((e) => console.error("Error playing sound:", e))
  }

  const toggleTodo = (id: string) => {
    const updatedTodos = todos.map((todo) => {
      if (todo.id === id) {
        const wasCompleted = todo.completed
        const now = Date.now()

        // Calculate time spent if completing the task
        let timeSpent = todo.timeSpent
        if (!wasCompleted) {
          // If this task was being actively timed, calculate the actual time spent
          if (activeTask === id && taskTimersRef.current[id]) {
            const taskTimer = taskTimersRef.current[id]
            const elapsedSeconds = Math.floor((now - taskTimer.startTime) / 1000)
            const elapsedMinutes = Math.round(elapsedSeconds / 60)
            timeSpent = taskTimer.totalTime + elapsedMinutes

            // Clear the active task
            setActiveTask(null)
            delete taskTimersRef.current[id]
          }

          // Record task completion for productivity tracking
          recordTaskCompletion({
            ...todo,
            timeSpent,
            completed: true,
            completedAt: now,
          })

          const newCount = completedToday + 1
          setCompletedToday(newCount)

          // Show achievement toast for milestones
          if (newCount % 5 === 0) {
            toast({
              title: "Achievement Unlocked! 🏆",
              description: `You've completed ${newCount} tasks today!`,
              duration: 5000,
            })
          }

          // Play completion sound
          const audio = new Audio("/sounds/complete.mp3")
          audio.volume = 0.5
          audio.play().catch((e) => console.error("Error playing sound:", e))
        }

        return {
          ...todo,
          completed: !wasCompleted,
          timeSpent,
          completedAt: !wasCompleted ? now : undefined,
        }
      }
      return todo
    })

    setTodos(updatedTodos)
  }

  // Add this function after toggleTodo
  const toggleTaskTimer = (id: string) => {
    const now = Date.now()

    // If there's already an active task, pause it first
    if (activeTask && activeTask !== id) {
      const activeTimer = taskTimersRef.current[activeTask]
      if (activeTimer) {
        const elapsedSeconds = Math.floor((now - activeTimer.startTime) / 1000)
        const elapsedMinutes = Math.round(elapsedSeconds / 60)
        activeTimer.totalTime += elapsedMinutes
        activeTimer.startTime = 0
      }
    }

    // Toggle the selected task
    if (activeTask === id) {
      // Pause this task
      const taskTimer = taskTimersRef.current[id]
      if (taskTimer) {
        const elapsedSeconds = Math.floor((now - taskTimer.startTime) / 1000)
        const elapsedMinutes = Math.round(elapsedSeconds / 60)
        taskTimer.totalTime += elapsedMinutes
        taskTimer.startTime = 0
      }
      setActiveTask(null)

      toast({
        title: "Task Paused",
        description: `Time tracking paused for this task`,
        duration: 2000,
      })
    } else {
      // Start this task
      if (!taskTimersRef.current[id]) {
        taskTimersRef.current[id] = { startTime: now, totalTime: 0 }
      } else {
        taskTimersRef.current[id].startTime = now
      }
      setActiveTask(id)

      toast({
        title: "Task Started",
        description: `Time tracking started for this task`,
        duration: 2000,
      })
    }

    // Save the task timer state
    localStorage.setItem("taskTimers", JSON.stringify(taskTimersRef.current))
  }

  // Add this function after toggleTaskTimer
  const adjustTaskTime = (id: string, minutes: number) => {
    const updatedTodos = todos.map((todo) => {
      if (todo.id === id) {
        // Ensure time doesn't go below 0
        const newTimeSpent = Math.max(0, todo.timeSpent + minutes)
        return {
          ...todo,
          timeSpent: newTimeSpent,
        }
      }
      return todo
    })

    setTodos(updatedTodos)

    toast({
      title: "Time Adjusted",
      description: `${minutes > 0 ? "Added" : "Removed"} ${Math.abs(minutes)} minutes`,
      duration: 2000,
    })
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id))

    // Play delete sound
    const audio = new Audio("/sounds/delete.mp3")
    audio.volume = 0.5
    audio.play().catch((e) => console.error("Error playing sound:", e))
  }

  const addTagToTodo = (id: string, tag: TaskTag) => {
    const updatedTodos = todos.map((todo) => {
      if (todo.id === id) {
        // Don't add duplicate tags
        if (todo.tags.includes(tag)) {
          return todo
        }

        return {
          ...todo,
          tags: [...todo.tags, tag],
        }
      }
      return todo
    })

    setTodos(updatedTodos)
  }

  const removeTagFromTodo = (id: string, tag: TaskTag) => {
    const updatedTodos = todos.map((todo) => {
      if (todo.id === id) {
        return {
          ...todo,
          tags: todo.tags.filter((t) => t !== tag),
        }
      }
      return todo
    })

    setTodos(updatedTodos)
  }

  // Check if all todos for today are completed
  const allTodosCompleted = todos.length > 0 && todos.every((todo) => todo.completed)

  // Show celebration if all todos are completed
  useEffect(() => {
    if (allTodosCompleted && todos.length >= 3) {
      toast({
        title: "All Tasks Completed! 🎉",
        description: "Great job! You've completed all your tasks for today!",
        duration: 5000,
      })
    }
  }, [allTodosCompleted, todos.length, toast])

  // Add this useEffect after other useEffects
  useEffect(() => {
    // Load task timers from localStorage
    const savedTimers = localStorage.getItem("taskTimers")
    if (savedTimers) {
      try {
        taskTimersRef.current = JSON.parse(savedTimers)

        // Check if there was an active task
        for (const [id, timer] of Object.entries(taskTimersRef.current)) {
          if (timer.startTime > 0) {
            setActiveTask(id)
            break
          }
        }
      } catch (error) {
        console.error("Error parsing task timers:", error)
      }
    }

    // Set up interval to periodically save task timer state
    const interval = setInterval(() => {
      if (activeTask && taskTimersRef.current[activeTask]) {
        localStorage.setItem("taskTimers", JSON.stringify(taskTimersRef.current))
      }
    }, 30000) // Save every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Add this useEffect to handle tab switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && activeTask) {
        // Tab is hidden, save the current timer state
        localStorage.setItem("taskTimers", JSON.stringify(taskTimersRef.current))
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [activeTask])

  return (
    <div className="space-y-4">
      {/* Enhance the To-Do List with better visual hierarchy and feedback */}

      {/* Improve the add task input and button */}
      <div className="flex space-x-2">
        <Input
          placeholder="Add a new task..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addTodo()
            }
          }}
          className="transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:shadow-md h-11 text-base"
        />
        <Button
          onClick={addTodo}
          size="icon"
          className="transition-transform hover:scale-105 active:scale-95 h-11 w-11 shadow-sm hover:shadow-md"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Add a progress bar for completed tasks */}
      <div className="flex items-center justify-between mb-3 mt-4">
        <span className="text-sm font-medium text-muted-foreground">
          {todos.filter((t) => t.completed).length} of {todos.length} completed
        </span>

        <span className="text-sm font-medium flex items-center gap-1">
          <Trophy className="h-4 w-4 text-accent" />
          <span className="font-semibold">{completedToday}</span> today
        </span>
      </div>

      {todos.length > 0 && (
        <div className="w-full h-2 bg-muted rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${todos.length > 0 ? (todos.filter((t) => t.completed).length / todos.length) * 100 : 0}%`,
            }}
          />
        </div>
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {todos.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No tasks yet. Add one above!</p>
        ) : (
          <div className="space-y-2">
            {todos.map((todo) => (
              /* Enhance the task items with better visual feedback and hover effects */
              <div
                key={todo.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  todo.completed ? "bg-muted/50" : "bg-background"
                } transition-all hover:shadow-md animate-in fade-in-0 duration-300 ${
                  todo.completed ? "" : "hover:border-primary/50"
                }`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Checkbox
                    id={`todo-${todo.id}`}
                    checked={todo.completed}
                    onCheckedChange={() => toggleTodo(todo.id)}
                    className="transition-transform data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <div className="flex flex-col min-w-0">
                    <label
                      htmlFor={`todo-${todo.id}`}
                      className={`text-sm ${todo.completed ? "line-through text-muted-foreground" : ""} transition-all truncate`}
                    >
                      {todo.text}
                    </label>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {todo.tags.length > 0 ? (
                        todo.tags.map((tag) => (
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
                            {!todo.completed && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-3 w-3 p-0 rounded-full hover:bg-destructive/20"
                                onClick={() => removeTagFromTodo(todo.id, tag)}
                              >
                                <X className="h-2 w-2" />
                              </Button>
                            )}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Tag className="h-3 w-3 mr-1" />
                          No tags
                        </span>
                      )}

                      {!todo.completed && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0 ml-1 rounded-full hover:bg-accent"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            {tags.map((tag) => (
                              <DropdownMenuItem
                                key={tag}
                                onClick={() => addTagToTodo(todo.id, tag)}
                                disabled={todo.tags.includes(tag)}
                              >
                                {tag}
                              </DropdownMenuItem>
                            ))}
                            {tags.length === 0 && <DropdownMenuItem disabled>No tags available</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      {todo.timeSpent > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{todo.timeSpent} min</span>

                          {!todo.completed && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => adjustTaskTime(todo.id, 5)}>
                                  Add 5 minutes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => adjustTaskTime(todo.id, 15)}>
                                  Add 15 minutes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => adjustTaskTime(todo.id, -5)}>
                                  Remove 5 minutes
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {!todo.completed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTaskTimer(todo.id)
                    }}
                    className={`h-8 w-8 ${activeTask === todo.id ? "text-green-500" : "text-muted-foreground"} hover:text-primary transition-colors`}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTodo(todo.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {allTodosCompleted && todos.length > 0 && (
          <div className="mt-4 p-3 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg text-center animate-in fade-in-0 duration-500">
            <p className="flex items-center justify-center gap-2">
              <Check className="h-5 w-5" />
              All tasks completed! Great job!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

