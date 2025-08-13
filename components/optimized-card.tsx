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

export function OptimizedCard({ title, value, subtitle, icon: Icon, gradient, iconColor }: OptimizedCardProps) {
  return (
    <Card className={`${gradient} text-white border-0 shadow-lg`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <span className="text-xs opacity-80">{title}</span>
        </div>
        <div className="text-xl font-bold mb-1">{value}</div>
        {subtitle && <div className="text-xs opacity-80">{subtitle}</div>}
      </CardContent>
    </Card>
  )
}
