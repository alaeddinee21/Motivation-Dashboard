"use client"

import { useEffect, useRef } from "react"
import { Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartOptions } from "chart.js"

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend)

interface PieChartProps {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string[]
    borderColor?: string[]
    borderWidth?: number
  }[]
  title?: string
  height?: number
}

export function PieChart({ labels, datasets, title, height = 300 }: PieChartProps) {
  const chartRef = useRef<ChartJS>(null)

  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: !!title,
        text: title || "",
        font: {
          size: 16,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        padding: 10,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        cornerRadius: 4,
        callbacks: {
          label: (context) => {
            const label = context.label || ""
            const value = context.raw as number
            const total = context.dataset.data.reduce((a, b) => (a as number) + (b as number), 0) as number
            const percentage = Math.round((value / total) * 100)
            return `${label}: ${value} mins (${percentage}%)`
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: "easeOutQuart",
    },
  }

  useEffect(() => {
    // Update chart on theme change
    const updateChartTheme = () => {
      if (chartRef.current) {
        const isDark = document.documentElement.classList.contains("dark")
        const textColor = isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"

        chartRef.current.options.plugins!.title!.color = textColor
        chartRef.current.options.plugins!.legend!.labels!.color = textColor

        chartRef.current.update()
      }
    }

    // Initial update
    updateChartTheme()

    // Listen for theme changes
    const observer = new MutationObserver(updateChartTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ height: `${height}px`, width: "100%" }}>
      <Pie ref={chartRef} data={{ labels, datasets }} options={options} />
    </div>
  )
}

