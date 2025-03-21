"use client"

import { Moon, Settings, Sun, BarChart2, Palette, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import Link from "next/link"

interface SettingsDropdownProps {
  theme: string | undefined
  setTheme: (theme: string) => void
}

export function SettingsDropdown({ theme, setTheme }: SettingsDropdownProps) {
  const [pomodoroLength, setPomodoroLength] = useState(25)

  const handlePomodoroChange = (minutes: number) => {
    setPomodoroLength(minutes)
    localStorage.setItem("pomodoroLength", minutes.toString())
    // Dispatch a custom event that the Pomodoro component will listen for
    window.dispatchEvent(
      new CustomEvent("pomodoro-settings-changed", {
        detail: { workTime: minutes * 60 },
      }),
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-[300px] overflow-y-auto">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
          {theme === "light" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
          {theme === "dark" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
          <span>System</span>
          {theme === "system" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Pomodoro Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handlePomodoroChange(25)} className="cursor-pointer">
          <span>25 minutes</span>
          {pomodoroLength === 25 && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePomodoroChange(30)} className="cursor-pointer">
          <span>30 minutes</span>
          {pomodoroLength === 30 && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePomodoroChange(45)} className="cursor-pointer">
          <span>45 minutes</span>
          {pomodoroLength === 45 && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/appearance" className="cursor-pointer flex items-center">
            <Palette className="mr-2 h-4 w-4" />
            <span>Appearance</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/productivity" className="cursor-pointer flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Productivity Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/productivity/insights" className="cursor-pointer flex items-center">
            <BarChart2 className="mr-2 h-4 w-4" />
            <span>Productivity Insights</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

