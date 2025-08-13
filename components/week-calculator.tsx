"use client"

// Helper function to get current Manila time
const getManilaTime = () => {
  return new Date().toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

// Helper function to get current day of week in Manila
const getCurrentDayManila = () => {
  return new Date().toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    weekday: "short",
  })
}

// Helper function to get week start date in Manila
const getWeekStartManila = () => {
  const now = new Date()
  const manilaDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }))
  const dayOfWeek = manilaDate.getDay()
  const diff = manilaDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday as start
  const weekStart = new Date(manilaDate.setDate(diff))
  return weekStart.toISOString().split("T")[0]
}

// King Ops style week numbering (biweekly cycles)
export const getKingOpsWeekNumber = (date: Date): number => {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1
  return Math.ceil(dayOfYear / 14) // 14-day cycles
}

// Format week display for King Ops style
export const formatWeekDisplay = (weekNumber: number, year: number): string => {
  return `KO-W${weekNumber.toString().padStart(2, "0")}-${year}`
}

// Get current biweekly schedule
export const getCurrentBiweeklySchedule = () => {
  const now = new Date()
  const manilaDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }))
  const weekNumber = getKingOpsWeekNumber(manilaDate)
  const year = manilaDate.getFullYear()

  return {
    weekNumber,
    year,
    display: formatWeekDisplay(weekNumber, year),
    isEvenWeek: weekNumber % 2 === 0,
    isOddWeek: weekNumber % 2 === 1,
  }
}

// Calculate biweekly payment dates
export const calculateBiweeklyPayments = (startDate: Date, endDate: Date) => {
  const payments = []
  const current = new Date(startDate)

  while (current <= endDate) {
    const weekNumber = getKingOpsWeekNumber(current)
    payments.push({
      date: new Date(current),
      weekNumber,
      display: formatWeekDisplay(weekNumber, current.getFullYear()),
      isPaymentWeek: weekNumber % 2 === 0, // Even weeks are payment weeks
    })

    // Move to next biweekly period
    current.setDate(current.getDate() + 14)
  }

  return payments
}

// WeekCalculator class for advanced calculations
export class WeekCalculator {
  static getCurrentWeek() {
    return getCurrentBiweeklySchedule()
  }

  static getWeekRange(weekNumber: number, year: number) {
    const startOfYear = new Date(year, 0, 1)
    const startDate = new Date(startOfYear)
    startDate.setDate(startDate.getDate() + (weekNumber - 1) * 14)

    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 13)

    return { startDate, endDate }
  }

  static isPaymentWeek(weekNumber: number) {
    return weekNumber % 2 === 0
  }

  static getNextPaymentWeek(currentWeek: number) {
    return currentWeek % 2 === 0 ? currentWeek + 2 : currentWeek + 1
  }
}

export default WeekCalculator
