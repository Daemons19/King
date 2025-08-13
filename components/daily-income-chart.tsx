"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts"

interface DailyIncomeData {
  day: string
  amount: number
  goal: number
  date: string
  isToday: boolean
  isPast: boolean
  isWorkDay: boolean
}

interface DailyIncomeChartProps {
  dailyIncome: DailyIncomeData[]
  currency: string
}

export function DailyIncomeChart({ dailyIncome, currency }: DailyIncomeChartProps) {
  // Transform data for the chart
  const chartData = dailyIncome.map((day) => ({
    day: day.day,
    amount: day.amount,
    goal: day.goal,
    isToday: day.isToday,
    isPast: day.isPast,
    isWorkDay: day.isWorkDay,
    date: day.date,
    fill: day.isToday
      ? "hsl(var(--chart-1))"
      : day.isPast
        ? day.amount >= day.goal
          ? "hsl(var(--chart-2))"
          : "hsl(var(--chart-3))"
        : "hsl(var(--chart-4))",
  }))

  const totalEarned = dailyIncome.reduce((sum, day) => sum + day.amount, 0)
  const totalGoal = dailyIncome.reduce((sum, day) => sum + day.goal, 0)
  const workDays = dailyIncome.filter((day) => day.isWorkDay)
  const workDaysEarned = workDays.reduce((sum, day) => sum + day.amount, 0)
  const workDaysGoal = workDays.reduce((sum, day) => sum + day.goal, 0)

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="text-gray-800">Daily Income Progress</CardTitle>
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Work Days: {currency}
            {workDaysEarned.toLocaleString()} / {currency}
            {workDaysGoal.toLocaleString()}
          </span>
          <span>{workDays.length} work days</span>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            amount: {
              label: "Earned",
              color: "hsl(var(--chart-1))",
            },
            goal: {
              label: "Goal",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[200px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value, index) => {
                  const data = chartData[index]
                  return data?.isWorkDay ? value : `${value}*`
                }}
              />
              <YAxis hide />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-medium">
                          {label} {data.isToday && "(Today)"}
                          {!data.isWorkDay && " - Rest Day"}
                        </p>
                        <p className="text-sm text-gray-600">Date: {data.date}</p>
                        <p className="text-sm text-green-600">
                          Earned: {currency}
                          {data.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-600">
                          Goal: {currency}
                          {data.goal.toLocaleString()}
                        </p>
                        {data.isWorkDay && (
                          <p className="text-sm text-gray-600">
                            Progress: {((data.amount / data.goal) * 100).toFixed(1)}%
                          </p>
                        )}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
              <ReferenceLine y={800} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-2 text-xs text-gray-500 text-center">
          * indicates rest day • Dashed line shows standard goal ({currency}800)
        </div>
      </CardContent>
    </Card>
  )
}
