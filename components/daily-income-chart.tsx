"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts"

interface DailyIncomeChartProps {
  dailyIncome: Array<{
    day: string
    amount: number
    goal: number
    date: string
    isToday: boolean
    isPast: boolean
    isWorkDay: boolean
  }>
  currency: string
}

export function DailyIncomeChart({ dailyIncome, currency }: DailyIncomeChartProps) {
  // Add visual indicators for chart data
  const chartData = dailyIncome.map((day) => ({
    ...day,
    displayDay: day.isToday ? `${day.day} (Today)` : day.day,
    opacity: day.isPast || day.isToday ? 1 : 0.5, // Dim future days
    displayAmount: day.isWorkDay ? day.amount : null, // Don't show amounts for rest days
    displayGoal: day.isWorkDay ? day.goal : null, // Don't show goals for rest days
  }))

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="text-gray-800 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>
          Daily Earnings - Current Week
        </CardTitle>
        <CardDescription>Your daily income vs goals (Work days only - Manila Time)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            displayAmount: { label: "Earned", color: "#10b981" },
            displayGoal: { label: "Goal", color: "#6b7280" },
          }}
          className="h-[200px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="futureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="displayDay"
                tick={{ fontSize: 12 }}
                tickFormatter={(value, index) => {
                  const day = chartData[index]
                  if (!day?.isWorkDay) return `${day?.day} (R)` // R for Rest
                  return day?.isToday ? `${value}*` : value
                }}
              />
              <YAxis />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value, name, props) => {
                  const day = props.payload[0]
                  if (!day?.isWorkDay) return ["Rest Day", ""]
                  return [
                    `${currency}${Number(value).toLocaleString()}`,
                    name === "displayAmount" ? "Earned" : "Goal",
                    day?.isToday ? " (Today)" : day?.isPast ? " (Past)" : " (Future)",
                  ]
                }}
              />
              <Area
                type="monotone"
                dataKey="displayAmount"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#incomeGradient)"
                connectNulls={false}
                opacity={(data) => data.opacity}
              />
              <ReferenceLine y={800} stroke="#6b7280" strokeDasharray="5 5" label="Mon-Sat Goal" />
              <ReferenceLine y={600} stroke="#9ca3af" strokeDasharray="3 3" label="Sunday Goal" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-2 text-xs text-gray-500 text-center">
          * Today | (R) Rest Day | Work days only shown in calculations
        </div>
      </CardContent>
    </Card>
  )
}
