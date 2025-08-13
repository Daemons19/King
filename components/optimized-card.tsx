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
    <Card className={`${gradient} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white/80 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-white/70 text-xs mt-1">{subtitle}</p>}
          </div>
          <div className={`${iconColor} ml-3`}>
            <Icon className="w-8 h-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
