"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

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
  const chartData = budgetCategories.map((category, index) => ({
    name: category.name,
    value: category.spent,
    budgeted: category.budgeted,
    fill: `hsl(${(index * 137.5) % 360}, 70%, 50%)`, // Generate colors
  }))

  const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0)
  const totalBudgeted = budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0)

  if (budgetCategories.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="text-gray-800">Spending Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No spending data available.</p>
            <p className="text-sm">Add budget categories in Settings to see your spending breakdown.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="text-gray-800">Spending Overview</CardTitle>
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Total Spent: {currency}
            {totalSpent.toLocaleString()}
          </span>
          <span>
            Budget: {currency}
            {totalBudgeted.toLocaleString()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            spending: {
              label: "Spending",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-gray-600">
                          Spent: {currency}
                          {data.value.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Budget: {currency}
                          {data.budgeted.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {((data.value / data.budgeted) * 100).toFixed(1)}% of budget
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>
                    {value} ({currency}
                    {entry.payload.value.toLocaleString()})
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
