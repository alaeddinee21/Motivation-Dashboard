"use client"

import { useEffect, useRef } from "react"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface BarChartProps {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string
    borderColor?: string
    borderWidth?: number
  }[]
  title?: string
  height?: number
}

export function BarChart({ labels, datasets, title, height = 300 }: BarChartProps) {
  const chartRef = useRef<ChartJS>(null)

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
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
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 12,
          },
        },
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        ticks: {
          font: {
            size: 12,
          },
        },
        grid: {
          display: false,
        },
      },
    },
    animation: {
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
        const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"

        chartRef.current.options.scales!.y!.ticks!.color = textColor
        chartRef.current.options.scales!.x!.ticks!.color = textColor
        chartRef.current.options.scales!.y!.grid!.color = gridColor
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
      <Bar ref={chartRef} data={{ labels, datasets }} options={options} />
    </div>
  )
}

