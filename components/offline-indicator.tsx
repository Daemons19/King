"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { WifiOff, Wifi, AlertCircle } from "lucide-react"

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine)

    // Handle online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      setShowIndicator(true)
      // Hide the indicator after 3 seconds when back online
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

  // Don't show indicator if online and not recently changed
  if (isOnline && !showIndicator) {
    return null
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <Card className={`border-0 shadow-lg ${isOnline ? "bg-green-500" : "bg-red-500"} text-white`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Back Online</span>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  Connected
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">You're Offline</span>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  No Internet
                </Badge>
              </>
            )}
          </div>
          {!isOnline && (
            <p className="text-xs mt-1 opacity-90">Your data is saved locally and will sync when reconnected</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
