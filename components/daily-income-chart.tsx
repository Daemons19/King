"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
    ...day,
    percentage: day.goal > 0 ? (day.amount / day.goal) * 100 : 0,
  }))

  // Calculate totals for work days only
  const workDays = dailyIncome.filter((day) => day.isWorkDay)
  const totalEarned = workDays.reduce((sum, day) => sum + day.amount, 0)
  const totalGoal = workDays.reduce((sum, day) => sum + day.goal, 0)
  const overallProgress = totalGoal > 0 ? (totalEarned / totalGoal) * 100 : 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium">
            {label} {data.isToday && "(Today)"}
            {!data.isWorkDay && " - Rest Day"}
          </p>
          <p className="text-sm text-gray-600">{data.date}</p>
          <p className="text-sm text-green-600">
            Earned: {currency}
            {data.amount.toLocaleString()}
          </p>
          <p className="text-sm text-blue-600">
            Goal: {currency}
            {data.goal.toLocaleString()}
          </p>
          {data.isWorkDay && <p className="text-sm text-purple-600">Progress: {data.percentage.toFixed(1)}%</p>}
        </div>
      )
    }
    return null
  }

  // Custom bar colors based on performance
  const getBarColor = (day: DailyIncomeData) => {
    if (!day.isWorkDay) return "#d1d5db" // gray-300 for rest days
    if (day.isToday) return "#8b5cf6" // purple-500 for today
    if (day.amount >= day.goal) return "#10b981" // emerald-500 for goal met
    if (day.isPast && day.amount === 0) return "#ef4444" // red-500 for missed days
    if (day.isPast) return "#f59e0b" // amber-500 for partial
    return "#6b7280" // gray-500 for future days
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="text-gray-800">Daily Income Progress</CardTitle>
        <CardDescription>
          Work days: {currency}
          {totalEarned.toLocaleString()} of {currency}
          {totalGoal.toLocaleString()}({overallProgress.toFixed(0)}%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" tickFormatter={(value) => `${currency}${value}`} />
              <Tooltip content={<CustomTooltip />} />

              {/* Goal line bars (background) */}
              <Bar dataKey="goal" fill="#e5e7eb" opacity={0.3} />

              {/* Actual earnings bars */}
              <Bar dataKey="amount" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-emerald-500 rounded"></div>
            <span>Goal Met</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-300 rounded"></div>
            <span>Rest Day</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-green-50 rounded">
            <p className="text-green-600 font-medium">Goals Met</p>
            <p className="font-bold">
              {workDays.filter((d) => d.amount >= d.goal).length}/{workDays.length}
            </p>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <p className="text-blue-600 font-medium">Avg Daily</p>
            <p className="font-bold">
              {currency}
              {workDays.length > 0 ? Math.round(totalEarned / workDays.length) : 0}
            </p>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded">
            <p className="text-purple-600 font-medium">Progress</p>
            <p className="font-bold">{overallProgress.toFixed(0)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
