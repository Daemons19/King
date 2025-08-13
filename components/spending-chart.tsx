"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BudgetCategory {
  id: number
  name: string
  budgeted: number
  spent: number
  color: string
}

interface SpendingChartProps {
  budgetCategories: BudgetCategory[]
  currency: string
}

export function SpendingChart({ budgetCategories, currency }: SpendingChartProps) {
  // Transform data for the pie chart
  const chartData = budgetCategories.map((category) => ({
    name: category.name,
    value: category.spent,
    budgeted: category.budgeted,
    percentage: category.budgeted > 0 ? (category.spent / category.budgeted) * 100 : 0,
    color: category.color,
  }))

  // Generate colors for the pie chart
  const COLORS = [
    "#10b981", // emerald-500
    "#3b82f6", // blue-500
    "#8b5cf6", // purple-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#06b6d4", // cyan-500
    "#84cc16", // lime-500
    "#f97316", // orange-500
  ]

  const totalSpent = chartData.reduce((sum, item) => sum + item.value, 0)
  const totalBudgeted = chartData.reduce((sum, item) => sum + item.budgeted, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            Spent: {currency}
            {data.value.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            Budget: {currency}
            {data.budgeted.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">{data.percentage.toFixed(1)}% of budget</p>
        </div>
      )
    }
    return null
  }

  if (budgetCategories.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="text-gray-800">Spending Overview</CardTitle>
          <CardDescription>Your spending breakdown by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No spending data yet.</p>
            <p className="text-sm">Add budget categories in Settings to track your spending.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="text-gray-800">Spending Overview</CardTitle>
        <CardDescription>
          {currency}
          {totalSpent.toLocaleString()} of {currency}
          {totalBudgeted.toLocaleString()} budget used
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>
                    {value}: {currency}
                    {entry.payload.value.toLocaleString()}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-green-600 font-medium">Total Spent</p>
            <p className="text-lg font-bold text-green-700">
              {currency}
              {totalSpent.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-600 font-medium">Remaining Budget</p>
            <p className="text-lg font-bold text-blue-700">
              {currency}
              {Math.max(0, totalBudgeted - totalSpent).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
