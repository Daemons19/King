"use client"

// King Ops Week Numbering System
// Weeks run Monday to Saturday (Sunday is not part of any week)
// Week numbers are continuous from the previous month

export interface WeekInfo {
  weekNumber: number
  startDate: Date
  endDate: Date
  monthLabel: string
  dateRange: string
  isCurrentWeek: boolean
}

export interface BiweeklyPeriod {
  period: "first" | "second"
  dateRange: string
  weekNumbers: number[]
  dueWeek: number
  fallbackWeek?: number
}

export class WeekCalculator {
  // Get the Monday of a given date
  static getMondayOfWeek(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(d.setDate(diff))
  }

  // Get week number based on continuous counting from previous month
  static getWeekNumber(date: Date): number {
    const monday = this.getMondayOfWeek(date)
    const year = monday.getFullYear()
    const month = monday.getMonth()

    // Find the first Monday of the year
    const firstMonday = new Date(year, 0, 1)
    while (firstMonday.getDay() !== 1) {
      firstMonday.setDate(firstMonday.getDate() + 1)
    }

    // Calculate week number from first Monday of year
    const diffTime = monday.getTime() - firstMonday.getTime()
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000))

    return diffWeeks + 1
  }

  // Get all weeks for a specific month with King Ops numbering
  static getMonthWeeks(year: number, month: number): WeekInfo[] {
    const weeks: WeekInfo[] = []
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Find the first Monday that affects this month
    const currentMonday = this.getMondayOfWeek(firstDay)

    // If the first Monday is before the month starts, it might still be relevant
    if (currentMonday < firstDay) {
      const saturday = new Date(currentMonday)
      saturday.setDate(saturday.getDate() + 5) // Saturday of that week

      // Only include if Saturday is in this month or later
      if (saturday >= firstDay) {
        // This week spans into our month, so include it
      } else {
        // Move to next Monday
        currentMonday.setDate(currentMonday.getDate() + 7)
      }
    }

    const today = new Date()
    const currentWeekNumber = this.getWeekNumber(today)

    while (currentMonday <= lastDay) {
      const saturday = new Date(currentMonday)
      saturday.setDate(saturday.getDate() + 5) // Saturday

      const weekNumber = this.getWeekNumber(currentMonday)
      const monthLabel = new Date(year, month).toLocaleString("default", { month: "long" })

      weeks.push({
        weekNumber,
        startDate: new Date(currentMonday),
        endDate: new Date(saturday),
        monthLabel,
        dateRange: `${currentMonday.getDate()}-${saturday.getDate()}`,
        isCurrentWeek: weekNumber === currentWeekNumber,
      })

      // Move to next Monday
      currentMonday.setDate(currentMonday.getDate() + 7)
    }

    return weeks
  }

  // Get biweekly periods for a month
  static getBiweeklyPeriods(year: number, month: number): BiweeklyPeriod[] {
    const weeks = this.getMonthWeeks(year, month)
    const lastDay = new Date(year, month + 1, 0).getDate()

    // First period: Days 1-15
    const firstPeriodWeeks = weeks.filter((week) => {
      const weekStart = week.startDate.getDate()
      const weekEnd = week.endDate.getDate()

      // Week overlaps with days 1-15
      return weekStart <= 15 || (weekEnd <= 15 && weekStart <= 15)
    })

    // Second period: Days 16-end of month
    const secondPeriodWeeks = weeks.filter((week) => {
      const weekStart = week.startDate.getDate()

      // Week starts on or after day 16
      return weekStart >= 16
    })

    return [
      {
        period: "first",
        dateRange: "1-15",
        weekNumbers: firstPeriodWeeks.map((w) => w.weekNumber),
        dueWeek: firstPeriodWeeks[0]?.weekNumber || 1,
        fallbackWeek: firstPeriodWeeks[1]?.weekNumber,
      },
      {
        period: "second",
        dateRange: `16-${lastDay}`,
        weekNumbers: secondPeriodWeeks.map((w) => w.weekNumber),
        dueWeek: secondPeriodWeeks[0]?.weekNumber || 3,
        fallbackWeek: secondPeriodWeeks[1]?.weekNumber,
      },
    ]
  }

  // Get week for a specific date
  static getWeekForDate(date: Date, year: number, month: number): number {
    const weeks = this.getMonthWeeks(year, month)
    const targetDate = new Date(date)

    for (const week of weeks) {
      if (targetDate >= week.startDate && targetDate <= week.endDate) {
        return week.weekNumber
      }
    }

    // If not found in current month, calculate directly
    return this.getWeekNumber(targetDate)
  }

  // Auto-assign week for monthly payable based on due date
  static assignWeekForMonthlyPayable(dueDate: string, year: number, month: number): number {
    const date = new Date(dueDate)
    return this.getWeekForDate(date, year, month)
  }

  // Get current week info
  static getCurrentWeekInfo(): WeekInfo {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const weeks = this.getMonthWeeks(year, month)

    return weeks.find((w) => w.isCurrentWeek) || weeks[0]
  }

  // Check if a date falls on Sunday (not part of any week)
  static isSunday(date: Date): boolean {
    return date.getDay() === 0
  }

  // Get next valid work day (skip Sunday)
  static getNextWorkDay(date: Date): Date {
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)

    if (this.isSunday(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1) // Skip to Monday
    }

    return nextDay
  }
}

// Helper function to format week display
export function formatWeekDisplay(weekInfo: WeekInfo): string {
  return `Week ${weekInfo.weekNumber} (${weekInfo.dateRange})`
}

// Helper function to get biweekly schedule for current month
export function getCurrentBiweeklySchedule(): BiweeklyPeriod[] {
  const today = new Date()
  return WeekCalculator.getBiweeklyPeriods(today.getFullYear(), today.getMonth())
}
