"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp } from "lucide-react"

interface IncomeChartProps {
  data: any[]
  currency: string
}

export function IncomeChart({ data, currency }: IncomeChartProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Weekly Income Overview
        </CardTitle>
        <CardDescription>Your income performance this week</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip
              formatter={(value: any) => [`${currency}${value.toLocaleString()}`, "Amount"]}
              labelStyle={{ color: "#374151" }}
            />
            <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
