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
    <Card className={`${gradient} border-0 text-white overflow-hidden relative`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white/80 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {subtitle && <p className="text-white/70 text-xs mt-1">{subtitle}</p>}
          </div>
          <div className={`${iconColor} opacity-80`}>
            <Icon className="w-8 h-8" />
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full" />
        <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-white/5 rounded-full" />
      </CardContent>
    </Card>
  )
}
