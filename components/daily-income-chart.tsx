"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2 } from "lucide-react"

interface Transaction {
  id: string
  type: "income" | "expense"
  amount: number
  date: string
}

interface DayEarnings {
  [key: string]: {
    amount: number
    isFinal: boolean
  }
}

interface DailyIncomeChartProps {
  weekDates: Date[]
  transactions: Transaction[]
  workDays: string[]
  dailyGoal: number
  currency: string
  dayEarnings: DayEarnings
}

export function DailyIncomeChart({
  weekDates,
  transactions,
  workDays,
  dailyGoal,
  currency,
  dayEarnings,
}: DailyIncomeChartProps) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getDailyIncome = (date: Date) => {
    return transactions
      .filter((t) => {
        const tDate = new Date(t.date)
        tDate.setHours(0, 0, 0, 0)
        const compareDate = new Date(date)
        compareDate.setHours(0, 0, 0, 0)
        return t.type === "income" && tDate.getTime() === compareDate.getTime()
      })
      .reduce((sum, t) => sum + t.amount, 0)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Income</CardTitle>
        <CardDescription>Track your daily earnings for this week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => {
            const dayName = days[date.getDay()]
            const isWorkDay = workDays.includes(dayName)
            const goal = isWorkDay ? dailyGoal : 0
            const income = getDailyIncome(date)
            const progress = goal > 0 ? (income / goal) * 100 : 0

            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const isToday = date.getTime() === today.getTime()
            const isPast = date < today

            const dateKey = date.toISOString().split("T")[0]
            const isDayFinal = dayEarnings[dateKey]?.isFinal

            return (
              <div
                key={index}
                className={`p-2 rounded-lg text-center ${
                  isToday ? "bg-purple-100 dark:bg-purple-900 ring-2 ring-purple-500" : "bg-muted"
                } ${!isWorkDay ? "opacity-50" : ""}`}
              >
                <div className="text-xs font-medium mb-1">{shortDays[date.getDay()]}</div>
                <div className="text-xs text-muted-foreground mb-2">{date.getDate()}</div>
                {isWorkDay ? (
                  <>
                    <div className="text-sm font-bold mb-1">
                      {currency}
                      {income.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <Progress value={progress} className="h-1 mb-1" />
                    <div className="text-[10px] text-muted-foreground">
                      {currency}
                      {goal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    {isDayFinal && (
                      <div className="mt-1 flex justify-center">
                        <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-[10px] text-muted-foreground">Rest</div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
