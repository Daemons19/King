"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface OptimizedCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  gradient: string
  iconColor: string
}

export default function OptimizedCard({ title, value, subtitle, icon: Icon, gradient, iconColor }: OptimizedCardProps) {
  return (
    <Card className={`${gradient} text-white border-0 shadow-lg`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium opacity-90">{title}</span>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="space-y-1">
          <p className="text-xl font-bold">{value}</p>
          {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
