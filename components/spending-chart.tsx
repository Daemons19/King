"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface SpendingChartProps {
  budgetCategories: Array<{
    name: string
    spent: number
    color: string
  }>
  currency: string
}

export function SpendingChart({ budgetCategories, currency }: SpendingChartProps) {
  const colorMap: { [key: string]: string } = {
    "from-emerald-500 to-teal-500": "#10b981",
    "from-blue-500 to-indigo-500": "#3b82f6",
    "from-purple-500 to-pink-500": "#8b5cf6",
    "from-orange-500 to-red-500": "#f97316",
    "from-yellow-500 to-orange-500": "#eab308",
  }

  const spendingData = budgetCategories.map((category) => ({
    name: category.name,
    value: category.spent,
    color: colorMap[category.color] || "#6b7280",
  }))

  if (budgetCategories.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500"></div>
            Weekly Spending
          </CardTitle>
          <CardDescription>Your expenses by category this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No spending categories yet.</p>
            <p className="text-sm">Add categories in Settings to track your expenses.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="text-gray-800 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500"></div>
          Weekly Spending
        </CardTitle>
        <CardDescription>Your expenses by category this week</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            food: { label: "Food", color: "#10b981" },
            transport: { label: "Transport", color: "#3b82f6" },
            entertainment: { label: "Entertainment", color: "#8b5cf6" },
            shopping: { label: "Shopping", color: "#f97316" },
            bills: { label: "Bills", color: "#eab308" },
          }}
          className="h-[200px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={spendingData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {spendingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value) => [`${currency}${Number(value).toLocaleString()}`, "Amount"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {spendingData.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-700">
                {item.name}: {currency}
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
