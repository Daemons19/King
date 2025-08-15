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
      // Hide the indicator after 3 seconds when coming back online
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

  // Always show when offline, show temporarily when coming back online
  if (!showIndicator && isOnline) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10001]">
      <Badge
        className={`${
          isOnline ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"
        } px-3 py-2 shadow-lg animate-in slide-in-from-top-2 duration-300`}
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4 mr-2" />
            Back Online
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 mr-2" />
            Offline Mode
          </>
        )}
      </Badge>
    </div>
  )
}
