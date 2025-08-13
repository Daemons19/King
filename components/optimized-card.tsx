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
    <Card
      className={`${gradient} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white/80 text-xs font-medium mb-1">{title}</p>
            <p className="text-xl font-bold mb-1 truncate">{value}</p>
            {subtitle && <p className="text-white/70 text-xs">{subtitle}</p>}
          </div>
          <div className={`${iconColor} ml-2 flex-shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
