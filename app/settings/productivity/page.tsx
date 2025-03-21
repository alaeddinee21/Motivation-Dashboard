"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Download, Upload, Plus, X, Tag, BarChart2, Settings2, Palette } from "lucide-react"
import {
  useTags,
  enableIdleDetection,
  exportProductivityData,
  importProductivityData,
  getTagColor,
  setTagColor,
} from "@/lib/productivity-store"
import { useToast } from "@/hooks/use-toast"

// Color options for tags
const TAG_COLORS = [
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
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#8b5cf6", // Indigo
  "#84cc16", // Lime
]

export default function ProductivitySettingsPage() {
  const { toast } = useToast()
  const [newTag, setNewTag] = useState("")
  const [idleDetection, setIdleDetection] = useState(true)
  const [timeFormat, setTimeFormat] = useState<"hours" | "minutes">("minutes")
  const { tags, addTag, removeTag } = useTags()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tagColors, setTagColors] = useState<Record<string, string>>({})

  // Load tag colors on mount
  useEffect(() => {
    const colors: Record<string, string> = {}
    tags.forEach((tag) => {
      colors[tag] = getTagColor(tag)
    })
    setTagColors(colors)
  }, [tags])

  // Toggle idle detection
  const handleIdleDetectionChange = (checked: boolean) => {
    setIdleDetection(checked)
    enableIdleDetection(checked)

    toast({
      title: checked ? "Idle Detection Enabled" : "Idle Detection Disabled",
      description: checked ? "Your inactive time will now be tracked" : "Your inactive time will no longer be tracked",
      duration: 3000,
    })
  }

  // Add a new tag
  const handleAddTag = () => {
    if (newTag.trim() === "") return

    if (tags.includes(newTag.trim())) {
      toast({
        title: "Tag already exists",
        description: `The tag "${newTag.trim()}" already exists`,
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    addTag(newTag.trim())
    setNewTag("")

    toast({
      title: "Tag Added",
      description: `The tag "${newTag.trim()}" has been added`,
      duration: 3000,
    })
  }

  // Remove a tag
  const handleRemoveTag = (tag: string) => {
    removeTag(tag)

    toast({
      title: "Tag Removed",
      description: `The tag "${tag}" has been removed`,
      duration: 3000,
    })
  }

  // Set tag color
  const handleSetTagColor = (tag: string, color: string) => {
    setTagColor(tag, color)
    setTagColors((prev) => ({
      ...prev,
      [tag]: color,
    }))

    toast({
      title: "Tag Color Updated",
      description: `The color for "${tag}" has been updated`,
      duration: 3000,
    })
  }

  // Export data
  const handleExportData = () => {
    const data = exportProductivityData()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `productivity-data-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Data Exported",
      description: "Your productivity data has been exported",
      duration: 3000,
    })
  }

  // Import data
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        const success = importProductivityData(content)

        if (success) {
          toast({
            title: "Data Imported",
            description: "Your productivity data has been imported successfully",
            duration: 3000,
          })
        } else {
          toast({
            title: "Import Failed",
            description: "Failed to import productivity data. The file may be invalid.",
            variant: "destructive",
            duration: 3000,
          })
        }
      }
    }
    reader.readAsText(file)

    // Reset the input
    e.target.value = ""
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productivity Settings</CardTitle>
              <CardDescription>Configure how productivity tracking works</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="idle-detection">Auto Idle Detection</Label>
                  <p className="text-sm text-muted-foreground">Automatically detect and track idle time</p>
                </div>
                <Switch id="idle-detection" checked={idleDetection} onCheckedChange={handleIdleDetectionChange} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pomodoro-sync">Pomodoro-Task Sync</Label>
                  <p className="text-sm text-muted-foreground">Link Pomodoro sessions with tasks automatically</p>
                </div>
                <Switch id="pomodoro-sync" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-reset">Daily Reset</Label>
                  <p className="text-sm text-muted-foreground">Reset statistics at the start of each day</p>
                </div>
                <Switch id="daily-reset" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time Tracking</CardTitle>
              <CardDescription>Configure time tracking settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-track">Auto Time Tracking</Label>
                  <p className="text-sm text-muted-foreground">Automatically track time spent on tasks</p>
                </div>
                <Switch id="auto-track" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="time-format">Time Format</Label>
                  <p className="text-sm text-muted-foreground">Choose how time is displayed in reports</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs ${timeFormat === "hours" ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => setTimeFormat("hours")}
                  >
                    Hours
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs ${timeFormat === "minutes" ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => setTimeFormat("minutes")}
                  >
                    Minutes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Tags</CardTitle>
              <CardDescription>Create and manage tags for categorizing your tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddTag()
                    }
                  }}
                />
                <Button onClick={handleAddTag}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tag
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1 py-1 px-3">
                    {tag}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full ml-1 hover:bg-destructive/20"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}

                {tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tags yet. Add your first tag above.</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              <p>
                Tags help you categorize tasks and filter productivity insights. Removing a tag will not delete
                historical data.
              </p>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Tag Colors
              </CardTitle>
              <CardDescription>Customize the colors for your tags</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <div key={tag} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: tagColors[tag] || "#6b7280" }}
                        />
                        <span>{tag}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            className={`w-5 h-5 rounded-full border ${tagColors[tag] === color ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-muted-foreground"}`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleSetTagColor(tag, color)}
                            aria-label={`Set ${tag} color to ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Add tags first to customize their colors.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export and import your productivity data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="flex items-center gap-2" onClick={handleExportData}>
                  <Download className="h-4 w-4" />
                  Export Data (JSON)
                </Button>

                <Button variant="outline" className="flex items-center gap-2" onClick={handleImportClick}>
                  <Upload className="h-4 w-4" />
                  Import Data
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              <p>
                Your productivity data is stored locally in your browser. Export regularly to avoid data loss when
                clearing browser data.
              </p>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Visualization</CardTitle>
              <CardDescription>Configure how your productivity data is visualized</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-idle">Show Idle Time</Label>
                  <p className="text-sm text-muted-foreground">Include idle time in productivity charts</p>
                </div>
                <Switch id="show-idle" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="default-view">Default View</Label>
                  <p className="text-sm text-muted-foreground">Choose the default time range for insights</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="text-xs bg-primary text-primary-foreground">
                    Day
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Week
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Month
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

