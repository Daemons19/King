"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target } from "lucide-react"

interface DailyIncomeChartProps {
  dailyIncome: any[]
  currency: string
}

export function DailyIncomeChart({ dailyIncome, currency }: DailyIncomeChartProps) {
  // Real-time calculations - recalculated on every render
  const workDays = dailyIncome.filter((day) => day.isWorkDay)
  const totalEarned = workDays.reduce((sum, day) => sum + (day.amount || 0), 0)
  const totalGoal = workDays.reduce((sum, day) => sum + (day.goal || 0), 0)
  const progress = totalGoal > 0 ? (totalEarned / totalGoal) * 100 : 0

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
          <Target className="w-5 h-5 text-green-600" />
          Work Days Progress (Real-time)
        </CardTitle>
        <CardDescription>This week's earnings vs goals ({workDays.length} work days)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Weekly Progress</span>
              <span className="font-medium">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {currency}
                {totalEarned.toLocaleString()} earned
              </span>
              <span>
                {currency}
                {totalGoal.toLocaleString()} goal
              </span>
            </div>
          </div>

          {/* Mini Daily Bars */}
          <div className="grid grid-cols-7 gap-1">
            {dailyIncome.map((day, index) => {
              const dayProgress = (day.goal || 0) > 0 ? ((day.amount || 0) / day.goal) * 100 : 0
              return (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-600 mb-1">{day.day}</div>
                  {day.isWorkDay ? (
                    <>
                      <div className="h-8 bg-gray-200 rounded relative overflow-hidden">
                        <div
                          className={`absolute bottom-0 left-0 right-0 rounded transition-all ${
                            dayProgress >= 100 ? "bg-green-500" : dayProgress > 0 ? "bg-orange-400" : "bg-gray-300"
                          }`}
                          style={{ height: `${Math.min(dayProgress, 100)}%` }}
                        />
                        {day.isToday && <div className="absolute inset-0 border-2 border-purple-400 rounded"></div>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {currency}
                        {(day.amount || 0).toLocaleString()}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-8 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-400">Rest</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">-</div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
