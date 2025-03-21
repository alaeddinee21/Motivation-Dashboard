"use client"

import { Flame } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface StreakCounterProps {
  streak: number
}

export function StreakCounter({ streak }: StreakCounterProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 bg-orange-500/20 dark:bg-orange-500/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full font-medium transition-all hover:scale-105 cursor-help">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-sm">
              {streak} day{streak !== 1 ? "s" : ""}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            You've used this dashboard for {streak} day{streak !== 1 ? "s" : ""} in a row!
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

