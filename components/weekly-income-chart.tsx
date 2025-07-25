"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"

interface WeeklyIncomeChartProps {
  weeklyIncome: Array<{
    week: string
    total: number
    daily: number
  }>
}

export function WeeklyIncomeChart({ weeklyIncome }: WeeklyIncomeChartProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
          Weekly Income Overview
        </CardTitle>
        <CardDescription>Your weekly earnings for the last 4 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            total: { label: "Weekly Total", color: "#8b5cf6" },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyIncome}>
              <defs>
                <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} formatter={(value) => [`$${value}`, "Total"]} />
              <Bar dataKey="total" fill="url(#weeklyGradient)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
