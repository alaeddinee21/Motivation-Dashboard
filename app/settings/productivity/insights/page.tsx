"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BarChart } from "@/components/charts/bar-chart"
import { PieChart } from "@/components/charts/pie-chart"
import { BarChart2, PieChartIcon, Clock, Calendar, CheckSquare, AlertCircle, Filter, Tag } from "lucide-react"
import {
  useProductivityData,
  getDateRange,
  useTags,
  type TaskTag,
  getTagColor,
  getAllTasks,
} from "@/lib/productivity-store"

// Chart colors
const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
  background: "hsl(var(--background))",
  tagColors: [
    "rgba(59, 130, 246, 0.7)", // Blue
    "rgba(139, 92, 246, 0.7)", // Purple
    "rgba(16, 185, 129, 0.7)", // Green
    "rgba(245, 158, 11, 0.7)", // Amber
    "rgba(156, 163, 175, 0.7)", // Gray
    "rgba(239, 68, 68, 0.7)", // Red
    "rgba(14, 165, 233, 0.7)", // Sky
    "rgba(168, 85, 247, 0.7)", // Violet
    "rgba(234, 179, 8, 0.7)", // Yellow
    "rgba(236, 72, 153, 0.7)", // Pink
  ],
}

// Define TaskData type
interface TaskData {
  id: string
  text: string
  tags: TaskTag[]
  timeSpent: number
  completed: boolean
  completedAt?: number
  createdAt: number
}

export default function ProductivityInsightsPage() {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week")
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedTag, setSelectedTag] = useState<TaskTag | null>(null)
  const { data, loading } = useProductivityData(timeRange)
  const { tags } = useTags()
  const [tagColors, setTagColors] = useState<Record<string, string>>({})
  const [chartType, setChartType] = useState<"pie" | "bar">("pie")
  const [topTasks, setTopTasks] = useState<TaskData[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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
    window.addEventListener("productivity_tags_changed", updateTagColors)

    return () => {
      window.removeEventListener("tag_colors_changed", updateTagColors)
      window.removeEventListener("productivity_tags_changed", updateTagColors)
    }
  }, [tags])

  // Listen for task updates
  useEffect(() => {
    const handleTaskUpdate = () => {
      // Trigger a refresh when tasks are updated
      setRefreshTrigger((prev) => prev + 1)
    }

    window.addEventListener("tasks_updated", handleTaskUpdate)

    return () => {
      window.removeEventListener("tasks_updated", handleTaskUpdate)
    }
  }, [])

  // Fetch and process top tasks
  useEffect(() => {
    const fetchTopTasks = () => {
      try {
        // Get all completed tasks
        const allTasks = getAllTasks()
        const completedTasks = allTasks.filter((task) => task.completed)

        // Filter tasks based on time range
        const filteredTasks = filterTasksByTimeRange(completedTasks, timeRange)

        // Filter by selected tag if any
        const tagFilteredTasks = selectedTag
          ? filteredTasks.filter((task) => task.tags.includes(selectedTag))
          : filteredTasks

        // Sort by time spent (descending)
        const sortedTasks = tagFilteredTasks.sort((a, b) => b.timeSpent - a.timeSpent)

        // Take top 5 tasks
        setTopTasks(sortedTasks.slice(0, 5))
      } catch (error) {
        console.error("Error fetching top tasks:", error)
        setTopTasks([])
      }
    }

    fetchTopTasks()
  }, [timeRange, selectedTag, refreshTrigger])

  // Helper function to filter tasks by time range
  const filterTasksByTimeRange = (tasks: TaskData[], range: "day" | "week" | "month"): TaskData[] => {
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

  // Format data for charts
  const getBarChartData = () => {
    const labels = getDateRange(timeRange).map((date) => {
      const d = new Date(date)
      return timeRange === "day" ? "Today" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    })

    // If a tag is selected, filter the data
    const filteredData = selectedTag
      ? data.map((d) => ({
          ...d,
          totalTimeSpent: d.taskTimeByTag[selectedTag] || 0,
        }))
      : data

    return {
      labels,
      datasets: [
        {
          label: "Time Spent (mins)",
          data: filteredData.map((d) => d.totalTimeSpent),
          backgroundColor: CHART_COLORS.primary,
        },
      ],
    }
  }

  const getTagsBarChartData = () => {
    // Aggregate data across the selected time range
    const aggregatedData = data.reduce(
      (acc, day) => {
        // Ensure taskTimeByTag exists
        const taskTimeByTag = day.taskTimeByTag || {}

        // Safely iterate through entries
        Object.entries(taskTimeByTag).forEach(([tag, time]) => {
          if (tag && time !== undefined) {
            acc[tag] = (acc[tag] || 0) + time
          }
        })
        return acc
      },
      {} as Record<TaskTag, number>,
    )

    // Filter out tags with zero time
    const filteredTags = Object.entries(aggregatedData)
      .filter(([_, time]) => time > 0)
      .map(([tag]) => tag)

    // If a tag is selected, only show that tag
    const tagsToShow = selectedTag ? [selectedTag] : filteredTags

    return {
      labels: tagsToShow,
      datasets: [
        {
          label: "Time by Tag (mins)",
          data: tagsToShow.map((tag) => aggregatedData[tag] || 0),
          backgroundColor: tagsToShow.map(
            (tag, i) => tagColors[tag] || CHART_COLORS.tagColors[i % CHART_COLORS.tagColors.length],
          ),
        },
      ],
    }
  }

  const getPieChartData = () => {
    // Aggregate data across the selected time range
    const aggregatedData = data.reduce(
      (acc, day) => {
        // Ensure taskTimeByTag exists
        const taskTimeByTag = day.taskTimeByTag || {}

        // Safely iterate through entries
        Object.entries(taskTimeByTag).forEach(([tag, time]) => {
          if (tag && time !== undefined) {
            acc[tag] = (acc[tag] || 0) + time
          }
        })
        return acc
      },
      {} as Record<TaskTag, number>,
    )

    // Filter out tags with zero time
    const filteredTags = Object.entries(aggregatedData)
      .filter(([_, time]) => time > 0)
      .map(([tag]) => tag)

    // If a tag is selected, only show that tag
    const tagsToShow = selectedTag ? [selectedTag] : filteredTags

    return {
      labels: tagsToShow.length > 0 ? tagsToShow : ["No Data"],
      datasets: [
        {
          label: "Time by Tag",
          data: tagsToShow.length > 0 ? tagsToShow.map((tag) => aggregatedData[tag] || 0) : [1], // Placeholder data when no real data exists
          backgroundColor:
            tagsToShow.length > 0
              ? tagsToShow.map((tag, i) => tagColors[tag] || CHART_COLORS.tagColors[i % CHART_COLORS.tagColors.length])
              : [CHART_COLORS.muted],
        },
      ],
    }
  }

  // Calculate summary stats
  const getSummaryStats = () => {
    return data.reduce(
      (acc, day) => {
        acc.totalTasksCompleted += day.totalTasksCompleted
        acc.totalPomodoroCompleted += day.totalPomodoroCompleted

        // If a tag is selected, only count time for that tag
        if (selectedTag) {
          acc.totalTimeSpent += day.taskTimeByTag[selectedTag] || 0
        } else {
          acc.totalTimeSpent += day.totalTimeSpent
        }

        acc.idleTime += day.idleTime
        return acc
      },
      {
        totalTasksCompleted: 0,
        totalPomodoroCompleted: 0,
        totalTimeSpent: 0,
        idleTime: 0,
      },
    )
  }

  const stats = getSummaryStats()

  // Handle tag selection
  const handleTagClick = (tag: TaskTag) => {
    if (selectedTag === tag) {
      setSelectedTag(null)
    } else {
      setSelectedTag(tag)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Productivity Insights</CardTitle>
          <CardDescription>Loading your productivity data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading your productivity data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Productivity Insights</CardTitle>
              <CardDescription>Track your productivity and focus time</CardDescription>
            </div>
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
              <TabsList>
                <TabsTrigger value="day">Today</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
            </TabsList>

            {selectedTag && (
              <div className="flex items-center justify-between mb-4 p-2 bg-muted/50 rounded-md">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <span>
                    Filtering by tag: <Badge>{selectedTag}</Badge>
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTag(null)} className="text-xs">
                  Clear Filter
                </Button>
              </div>
            )}

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-background/50">
                  <CardContent className="p-4 flex flex-col items-center justify-center">
                    <CheckSquare className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Tasks Completed</p>
                    <h3 className="text-2xl font-bold">{stats.totalTasksCompleted}</h3>
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardContent className="p-4 flex flex-col items-center justify-center">
                    <Clock className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Pomodoros</p>
                    <h3 className="text-2xl font-bold">{stats.totalPomodoroCompleted}</h3>
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardContent className="p-4 flex flex-col items-center justify-center">
                    <Calendar className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Time Spent</p>
                    <h3 className="text-2xl font-bold">{Math.round(stats.totalTimeSpent)} min</h3>
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardContent className="p-4 flex flex-col items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Idle Time</p>
                    <h3 className="text-2xl font-bold">{Math.round(stats.idleTime)} min</h3>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Time Distribution</CardTitle>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant={chartType === "pie" ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setChartType("pie")}
                        >
                          <PieChartIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={chartType === "bar" ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setChartType("bar")}
                        >
                          <BarChart2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {chartType === "pie" ? (
                      <PieChart {...getPieChartData()} height={200} />
                    ) : (
                      <BarChart {...getTagsBarChartData()} height={200} />
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Top Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topTasks.length > 0 ? (
                      <div className="space-y-4">
                        {topTasks.map((task, index) => (
                          <div key={task.id} className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">{task.text}</p>
                              <p className="text-sm text-muted-foreground">
                                {task.tags.length > 0 ? task.tags.join(", ") : "No tags"}
                              </p>
                            </div>
                            <div className="text-sm font-medium">{task.timeSpent} min</div>
                            {index < topTasks.length - 1 && <Separator className="mt-4" />}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[200px] text-center">
                        <p className="text-muted-foreground">No tasks completed yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Complete tasks to see them here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="charts" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg flex items-center">
                        <BarChart2 className="h-5 w-5 mr-2" />
                        Time Spent
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <BarChart {...getBarChartData()} height={300} />
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg flex items-center">
                        <Tag className="h-5 w-5 mr-2" />
                        Tag Breakdown
                      </CardTitle>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant={chartType === "pie" ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setChartType("pie")}
                        >
                          <PieChartIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={chartType === "bar" ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setChartType("bar")}
                        >
                          <BarChart2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {chartType === "pie" ? (
                      <PieChart {...getPieChartData()} height={300} />
                    ) : (
                      <BarChart {...getTagsBarChartData()} height={300} />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tags" className="space-y-4">
              <Card className="bg-background/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Tag className="h-5 w-5 mr-2" />
                    Filter by Tag
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge
                        key={tag}
                        variant={selectedTag === tag ? "default" : "outline"}
                        className="cursor-pointer py-1 px-3"
                        style={{
                          backgroundColor:
                            selectedTag === tag
                              ? tagColors[tag] || CHART_COLORS.tagColors[index % CHART_COLORS.tagColors.length]
                              : undefined,
                          borderColor: selectedTag !== tag ? tagColors[tag] : undefined,
                          color: selectedTag !== tag ? tagColors[tag] : undefined,
                        }}
                        onClick={() => handleTagClick(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}

                    {tags.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No tags available. Add tags in the Productivity Settings.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Tag Statistics</CardTitle>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant={chartType === "pie" ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setChartType("pie")}
                      >
                        <PieChartIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={chartType === "bar" ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setChartType("bar")}
                      >
                        <BarChart2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {chartType === "pie" ? (
                    <PieChart {...getPieChartData()} height={300} />
                  ) : (
                    <BarChart {...getTagsBarChartData()} height={300} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

