"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { PieChart } from "lucide-react"

interface SpendingChartProps {
  budgetCategories: any[]
  currency: string
}

export function SpendingChart({ budgetCategories, currency }: SpendingChartProps) {
  // Real-time calculations
  const totalBudgeted = budgetCategories.reduce((sum, cat) => sum + (cat.budgeted || 0), 0)
  const totalSpent = budgetCategories.reduce((sum, cat) => sum + (cat.spent || 0), 0)
  const overallProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-purple-600" />
          Budget Overview
        </CardTitle>
        <CardDescription>Your spending vs budget categories (Real-time)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Spent</span>
              <span className="font-medium">{overallProgress.toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(overallProgress, 100)} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {currency}
                {totalSpent.toLocaleString()} spent
              </span>
              <span>
                {currency}
                {totalBudgeted.toLocaleString()} budgeted
              </span>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-3">
            {budgetCategories.map((category, index) => {
              const percentage = (category.budgeted || 0) > 0 ? ((category.spent || 0) / category.budgeted) * 100 : 0
              const isOverBudget = (category.spent || 0) > (category.budgeted || 0)

              return (
                <div key={category.id || index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full bg-gradient-to-r ${category.color || "from-gray-400 to-gray-500"}`}
                      ></div>
                      <span className="font-medium text-gray-800">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${isOverBudget ? "text-red-600" : "text-gray-600"}`}>
                        {currency}
                        {(category.spent || 0).toLocaleString()} / {currency}
                        {(category.budgeted || 0).toLocaleString()}
                      </span>
                      {isOverBudget && (
                        <Badge variant="destructive" className="text-xs">
                          Over
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className={`h-2 ${isOverBudget ? "bg-red-100" : ""}`} />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{percentage.toFixed(0)}% used</span>
                    {isOverBudget && (
                      <span className="text-red-600">
                        Over by {currency}
                        {((category.spent || 0) - (category.budgeted || 0)).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {budgetCategories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No budget categories yet</p>
              <p className="text-sm">Add categories in Settings to track spending</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
