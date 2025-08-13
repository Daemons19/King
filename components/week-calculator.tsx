"use client"

// King Ops Week System: Monday-Saturday weeks (Sunday excluded)
export class WeekCalculator {
  // Get the Monday of a given date
  static getMondayOfWeek(date: Date): Date {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
    return new Date(date.getFullYear(), date.getMonth(), diff)
  }

  // Get Saturday of a given date's week
  static getSaturdayOfWeek(date: Date): Date {
    const monday = this.getMondayOfWeek(date)
    return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 5)
  }

  // Get all weeks in a month using King Ops system
  static getMonthWeeks(year: number, month: number) {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const today = new Date()

    const weeks = []
    let weekNumber = 1

    // Start from the first Monday of or before the month
    let currentMonday = this.getMondayOfWeek(firstDay)

    // If the first Monday is in the previous month, it continues the week numbering
    if (currentMonday.getMonth() !== month) {
      // Get the previous month's last week number and continue
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year
      const prevMonthWeeks = this.getMonthWeeks(prevYear, prevMonth)
      weekNumber = prevMonthWeeks.length + 1
    }

    while (currentMonday <= lastDay) {
      const saturday = this.getSaturdayOfWeek(currentMonday)

      // Check if this week overlaps with the current month
      if (currentMonday.getMonth() === month || saturday.getMonth() === month) {
        const isCurrentWeek = today >= currentMonday && today <= saturday

        weeks.push({
          weekNumber,
          startDate: new Date(currentMonday),
          endDate: new Date(saturday),
          isCurrentWeek,
          monthOverlap: {
            startsInMonth: currentMonday.getMonth() === month,
            endsInMonth: saturday.getMonth() === month,
          },
        })
        weekNumber++
      }

      // Move to next Monday
      currentMonday = new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate() + 7)
    }

    return weeks
  }

  // Get current week info
  static getCurrentWeekInfo() {
    const today = new Date()
    const monday = this.getMondayOfWeek(today)
    const saturday = this.getSaturdayOfWeek(today)

    const year = today.getFullYear()
    const month = today.getMonth()
    const monthWeeks = this.getMonthWeeks(year, month)

    const currentWeek = monthWeeks.find((week) => week.isCurrentWeek)

    return {
      weekNumber: currentWeek?.weekNumber || 1,
      startDate: monday,
      endDate: saturday,
      monthWeeks,
    }
  }

  // Assign week for monthly payable based on due date
  static assignWeekForMonthlyPayable(dueDate: string, year: number, month: number): number {
    const targetDate = new Date(dueDate)
    const monthWeeks = this.getMonthWeeks(year, month)

    for (const week of monthWeeks) {
      if (targetDate >= week.startDate && targetDate <= week.endDate) {
        return week.weekNumber
      }
    }

    // Fallback to first week if no match
    return monthWeeks[0]?.weekNumber || 1
  }

  // Get the current week number using King Ops style (1-based, Monday start)
  static getCurrentWeekNumber(): number {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Find the first Monday of the year
    const firstMonday = new Date(startOfYear)
    const dayOfWeek = startOfYear.getDay()
    const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek // If Sunday, add 1, else add days to next Monday
    firstMonday.setDate(startOfYear.getDate() + daysToAdd)

    // Calculate weeks since first Monday
    const diffTime = now.getTime() - firstMonday.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const weekNumber = Math.floor(diffDays / 7) + 1

    return Math.max(1, weekNumber)
  }

  // Get week range (1st-15th or 16th-end of month)
  static getCurrentWeekRange(): "first-half" | "second-half" {
    const now = new Date()
    const dayOfMonth = now.getDate()

    return dayOfMonth <= 15 ? "first-half" : "second-half"
  }

  // Get the next available biweekly slot
  static getNextBiweeklySlot(): { range: "first-half" | "second-half"; month: number; year: number } {
    const now = new Date()
    const currentRange = this.getCurrentWeekRange()

    if (currentRange === "first-half") {
      // Move to second half of current month
      return {
        range: "second-half",
        month: now.getMonth(),
        year: now.getFullYear(),
      }
    } else {
      // Move to first half of next month
      const nextMonth = now.getMonth() + 1
      const nextYear = nextMonth > 11 ? now.getFullYear() + 1 : now.getFullYear()

      return {
        range: "first-half",
        month: nextMonth > 11 ? 0 : nextMonth,
        year: nextYear,
      }
    }
  }

  // Format week range for display
  static formatWeekRange(range: "first-half" | "second-half", month: number, year: number): string {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    const monthName = monthNames[month]
    const rangeText = range === "first-half" ? "1st-15th" : "16th-End"

    return `${monthName} ${rangeText}, ${year}`
  }

  // Check if a date falls within a specific biweekly range
  static isDateInRange(date: Date, range: "first-half" | "second-half", month: number, year: number): boolean {
    if (date.getFullYear() !== year || date.getMonth() !== month) {
      return false
    }

    const dayOfMonth = date.getDate()

    if (range === "first-half") {
      return dayOfMonth >= 1 && dayOfMonth <= 15
    } else {
      return dayOfMonth >= 16
    }
  }

  // Get all dates in a biweekly range
  static getDatesInRange(range: "first-half" | "second-half", month: number, year: number): Date[] {
    const dates: Date[] = []

    if (range === "first-half") {
      for (let day = 1; day <= 15; day++) {
        dates.push(new Date(year, month, day))
      }
    } else {
      const lastDay = new Date(year, month + 1, 0).getDate()
      for (let day = 16; day <= lastDay; day++) {
        dates.push(new Date(year, month, day))
      }
    }

    return dates
  }
}

// Helper function to format week display
export function formatWeekDisplay(week: any): string {
  return `Week ${week.weekNumber}`
}

// Get biweekly schedule for current month
export function getCurrentBiweeklySchedule() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const monthWeeks = WeekCalculator.getMonthWeeks(year, month)

  // First period: Days 1-15 (Week 1, fallback Week 2)
  // Second period: Days 16-End (Week 3, fallback Week 4 or 5)

  const firstPeriod = {
    period: "first" as const,
    dateRange: "1-15",
    weekNumbers: [1, 2],
    dueWeek: 1,
    fallbackWeek: 2,
  }

  const secondPeriod = {
    period: "second" as const,
    dateRange: "16-End",
    weekNumbers: monthWeeks.length >= 5 ? [3, 4, 5] : [3, 4],
    dueWeek: 3,
    fallbackWeek: monthWeeks.length >= 5 ? 4 : 4,
  }

  return [firstPeriod, secondPeriod]
}
