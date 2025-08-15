"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowIndicator(true)
      // Hide the "back online" indicator after 3 seconds
      setTimeout(() => setShowIndicator(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Only show indicator when offline or briefly when coming back online
  if (!showIndicator && isOnline) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <Badge
        variant={isOnline ? "default" : "destructive"}
        className={`flex items-center gap-2 px-3 py-2 ${
          isOnline ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
        } text-white shadow-lg`}
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            Back Online
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            Offline Mode
          </>
        )}
      </Badge>
    </div>
  )
}
