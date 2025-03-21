import { NextResponse } from "next/server"

// Fallback productivity tips if API fails
const fallbackTips = [
  "Use the 2-minute rule: If a task takes less than 2 minutes, do it now.",
  "Try the Pomodoro Technique: Work for 25 minutes, then take a 5-minute break.",
  "Plan tomorrow's tasks at the end of today.",
  "Tackle your most challenging task first thing in the morning.",
  "Batch similar tasks together to minimize context switching.",
  "Take short breaks to maintain focus and prevent burnout.",
  "Use the 80/20 rule: Focus on the 20% of tasks that yield 80% of results.",
  "Set specific goals for each work session.",
  "Minimize distractions by silencing notifications during focused work.",
  "Stay hydrated and take short walks to boost productivity.",
]

// Productivity tips API
export async function GET() {
  try {
    // Try to fetch from an external API (using a productivity-focused API)
    // Note: This is a simulated API call since there's no specific productivity tips API
    const response = await fetch("https://zenquotes.io/api/random", {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error("Failed to fetch tip")
    }

    const data = await response.json()

    // Transform the quote into a productivity tip
    const tip = `${data[0].q.replace(/\.$/g, "")} to boost your productivity.`

    return NextResponse.json({
      tip,
      source: "api",
    })
  } catch (error) {
    // Return a random fallback tip
    const randomTip = fallbackTips[Math.floor(Math.random() * fallbackTips.length)]

    return NextResponse.json({
      tip: randomTip,
      source: "fallback",
    })
  }
}

