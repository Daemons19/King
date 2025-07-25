"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// This component is no longer needed for the daily-focused app
// Keeping it for compatibility but it won't be used in the main interface

interface IncomeChartProps {
  incomeData: Array<{
    month: string
    salary: number
    freelance: number
    other: number
  }>
}

export function IncomeChart({ incomeData }: IncomeChartProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="text-gray-800">Monthly Income (Legacy)</CardTitle>
        <CardDescription>This view is not used in the daily-focused app</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          This component is kept for compatibility but not displayed in the mobile app interface.
        </p>
      </CardContent>
    </Card>
  )
}
