// This file ensures Chart.js is properly set up for the client-side
// Import this in any component that uses Chart.js

import { Chart, registerables } from "chart.js"

// Register all Chart.js components
Chart.register(...registerables)

// Set default options
Chart.defaults.font.family = "Inter, sans-serif"
Chart.defaults.color = "rgba(0, 0, 0, 0.7)"
Chart.defaults.borderColor = "rgba(0, 0, 0, 0.1)"

// Update chart colors based on theme
export const updateChartTheme = (chart: Chart, isDark: boolean) => {
  const textColor = isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)"
  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"

  chart.options.color = textColor
  chart.options.borderColor = gridColor

  if (chart.options.scales?.y) {
    chart.options.scales.y.ticks = {
      ...chart.options.scales.y.ticks,
      color: textColor,
    }
    chart.options.scales.y.grid = {
      ...chart.options.scales.y.grid,
      color: gridColor,
    }
  }

  if (chart.options.scales?.x) {
    chart.options.scales.x.ticks = {
      ...chart.options.scales.x.ticks,
      color: textColor,
    }
    chart.options.scales.x.grid = {
      ...chart.options.scales.x.grid,
      color: gridColor,
    }
  }

  chart.update()
}

