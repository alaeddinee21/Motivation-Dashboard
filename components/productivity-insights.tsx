"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { BarChart } from "@/components/charts/bar-chart"
import { PieChart } from "@/components/charts/pie-chart"
import {
  BarChart2,
  PieChartIcon,
  Clock,
  Calendar,
  CheckSquare,
  Download,
  SettingsIcon,
  AlertCircle,
} from "lucide-react"
import {
  useProductivityData,
  getDateRange,
  enableIdleDetection,
  initIdleDetection,
  DEFAULT_CATEGORIES,
} from "@/lib/productivity-store"

// Chart colors
const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
  background: "hsl(var(--background))",
  categoryColors: [
    "rgba(59, 130, 246, 0.7)", // Deep Work - Blue
    "rgba(139, 92, 246, 0.7)", // Meetings - Purple
    "rgba(16, 185, 129, 0.7)", // Learning - Green
    "rgba(245, 158, 11, 0.7)", // Admin - Amber
    "rgba(156, 163, 175, 0.7)", // Other - Gray
  ],
}

// Define TaskTag type
type TaskTag = string

export function ProductivityInsights() {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("day")
  const [idleDetection, setIdleDetection] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const { data, loading } = useProductivityData(timeRange)

  // Initialize idle detection
  useEffect(() => {
    initIdleDetection()
  }, [])

  // Toggle idle detection
  useEffect(() => {
    enableIdleDetection(idleDetection)
  }, [idleDetection])

  // Format data for charts
  const getBarChartData = () => {
    const labels = getDateRange(timeRange).map((date) => {
      const d = new Date(date)
      return timeRange === "day" ? "Today" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    })

    return {
      labels,
      datasets: [
        {
          label: "Time Spent (mins)",
          data: data.map((d) => d.totalTimeSpent),
          backgroundColor: CHART_COLORS.primary,
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

    return {
      labels: filteredTags.length > 0 ? filteredTags : ["No Data"],
      datasets: [
        {
          label: "Time by Category",
          data: filteredTags.length > 0 ? filteredTags.map((tag) => aggregatedData[tag] || 0) : [1], // Placeholder data when no real data exists
          backgroundColor:
            filteredTags.length > 0
              ? filteredTags.map((_, i) => CHART_COLORS.categoryColors[i % CHART_COLORS.categoryColors.length])
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
        acc.totalTimeSpent += day.totalTimeSpent
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

  // Export data as JSON
  const exportData = () => {
    const exportData = {
      timeRange,
      data,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `productivity-data-${timeRange}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card className="backdrop-blur-sm bg-background/90 transition-all hover:shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">Productivity Insights</CardTitle>
          <CardDescription className="text-muted-foreground/80">Loading your productivity data...</CardDescription>
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
    <Card className="backdrop-blur-sm bg-background/90 transition-all hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold">Productivity Insights</CardTitle>
            <CardDescription className="text-muted-foreground/80">
              Track your productivity and focus time
            </CardDescription>
          </div>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="hidden sm:block">
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
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

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
                  <CardTitle className="text-lg">Time Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChart {...getPieChartData()} height={200} />
                </CardContent>
              </Card>

              <Card className="bg-background/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Top Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.totalTasksCompleted > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">Deep Work Session</p>
                          <p className="text-sm text-muted-foreground">Deep Work</p>
                        </div>
                        <div className="text-sm font-medium">45 min</div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">Project Planning</p>
                          <p className="text-sm text-muted-foreground">Admin</p>
                        </div>
                        <div className="text-sm font-medium">30 min</div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">Learning React</p>
                          <p className="text-sm text-muted-foreground">Learning</p>
                        </div>
                        <div className="text-sm font-medium">25 min</div>
                      </div>
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
                    <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="block sm:hidden">
                      <TabsList>
                        <TabsTrigger value="day">Day</TabsTrigger>
                        <TabsTrigger value="week">Week</TabsTrigger>
                        <TabsTrigger value="month">Month</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent>
                  <BarChart {...getBarChartData()} height={300} />
                </CardContent>
              </Card>

              <Card className="bg-background/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2" />
                    Category Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChart {...getPieChartData()} height={300} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-background/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <SettingsIcon className="h-5 w-5 mr-2" />
                  Productivity Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="idle-detection">Auto Idle Detection</Label>
                    <p className="text-sm text-muted-foreground">Automatically detect and track idle time</p>
                  </div>
                  <Switch id="idle-detection" checked={idleDetection} onCheckedChange={setIdleDetection} />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Task Categories</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {DEFAULT_CATEGORIES.map((category, index) => (
                      <div key={category} className="flex items-center p-2 rounded-md border">
                        <div
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: CHART_COLORS.categoryColors[index] }}
                        />
                        <span>{category}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="pt-2">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={exportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Productivity Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

