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
