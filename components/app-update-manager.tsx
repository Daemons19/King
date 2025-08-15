"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Download, RefreshCw, Loader2, CheckCircle, AlertCircle, Smartphone, Globe, Wifi, WifiOff } from "lucide-react"

interface AppUpdateManagerProps {
  onUpdateComplete?: () => void
}

export function AppUpdateManager({ onUpdateComplete }: AppUpdateManagerProps) {
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<{
    type: "success" | "error" | "info" | "warning"
    message: string
  } | null>(null)
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true)
  const [updateProgress, setUpdateProgress] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const [isPWAInstalled, setIsPWAInstalled] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [currentVersion] = useState("v35")

  // Check if PWA is installed
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      const isInWebAppChrome = window.matchMedia("(display-mode: standalone)").matches

      setIsPWAInstalled(isStandalone || isInWebAppiOS || isInWebAppChrome)

      // Load auto-update preference
      const saved = localStorage.getItem("autoUpdateEnabled")
      if (saved) {
        setAutoUpdateEnabled(JSON.parse(saved))
      }

      // Check online status
      setIsOnline(navigator.onLine)

      // Listen for online/offline events
      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)

      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)

      return () => {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    }
  }, [])

  // Save auto-update preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("autoUpdateEnabled", JSON.stringify(autoUpdateEnabled))
    }
  }, [autoUpdateEnabled])

  // Listen for service worker updates
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "UPDATE_AVAILABLE") {
          setUpdateAvailable(true)
          setUpdateStatus({
            type: "info",
            message: "New app version available! Click download to update.",
          })
        }
      })

      // Auto-check for updates if enabled
      if (autoUpdateEnabled) {
        setTimeout(() => {
          checkForUpdates()
        }, 3000) // Check 3 seconds after component mounts
      }
    }
  }, [autoUpdateEnabled])

  const checkForUpdates = async () => {
    if (!isOnline) {
      setUpdateStatus({
        type: "warning",
        message: "Cannot check for updates while offline.",
      })
      return
    }

    setIsCheckingUpdates(true)
    setUpdateStatus(null)

    try {
      // Simulate checking for updates
      await new Promise((resolve) => setTimeout(resolve, 2000))

      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.update()

          // Check if there's a waiting service worker
          if (registration.waiting) {
            setUpdateAvailable(true)
            setUpdateStatus({
              type: "info",
              message: "New version available! Click download to update.",
            })
          } else {
            setUpdateStatus({
              type: "success",
              message: "You have the latest version!",
            })
          }
        } else {
          setUpdateStatus({
            type: "success",
            message: "You have the latest version!",
          })
        }
      }
    } catch (error) {
      setUpdateStatus({
        type: "error",
        message: "Failed to check for updates. Please try again.",
      })
    } finally {
      setIsCheckingUpdates(false)
    }
  }

  const downloadLatestVersion = async () => {
    if (!isOnline) {
      setUpdateStatus({
        type: "warning",
        message: "Cannot download updates while offline.",
      })
      return
    }

    setIsDownloading(true)
    setUpdateStatus(null)
    setUpdateProgress(0)

    try {
      // Simulate download progress
      const progressInterval = setInterval(() => {
        setUpdateProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()

        if (registration && registration.waiting) {
          // Tell the waiting service worker to skip waiting and become active
          registration.waiting.postMessage({ type: "SKIP_WAITING" })

          // Listen for the controlling service worker change
          const handleControllerChange = () => {
            setUpdateProgress(100)
            setUpdateStatus({
              type: "success",
              message: "App updated successfully! Refreshing...",
            })

            // Call completion callback
            if (onUpdateComplete) {
              onUpdateComplete()
            }

            // Auto-refresh after 2 seconds
            setTimeout(() => {
              window.location.reload()
            }, 2000)

            navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange)
          }

          navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange)
        } else {
          // Force cache update
          await caches.delete("budget-tracker-v35")

          // Re-register service worker
          await navigator.serviceWorker.register("/sw.js")

          setUpdateProgress(100)
          setUpdateStatus({
            type: "success",
            message: "App cache updated! Refreshing...",
          })

          // Auto-refresh after 2 seconds
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }

        setUpdateAvailable(false)
      } else {
        // Fallback for browsers without service worker support
        setUpdateProgress(100)
        setUpdateStatus({
          type: "info",
          message: "Please refresh your browser to get the latest version.",
        })
      }
    } catch (error) {
      setUpdateStatus({
        type: "error",
        message: "Failed to download update. Please try again.",
      })
    } finally {
      setIsDownloading(false)
      setTimeout(() => setUpdateProgress(0), 3000)
    }
  }

  const getInstallationStatus = () => {
    if (isPWAInstalled) {
      return {
        icon: Smartphone,
        text: "Installed as App",
        color: "text-green-600",
        bgColor: "bg-green-100",
      }
    } else {
      return {
        icon: Globe,
        text: "Running in Browser",
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      }
    }
  }

  const installStatus = getInstallationStatus()

  return (
    <Card className="bg-white/90 border-0">
      <CardHeader>
        <CardTitle className="text-gray-800 flex items-center gap-2">
          <Download className="w-5 h-5 text-green-600" />
          PWA App Updates
        </CardTitle>
        <CardDescription>Keep your offline app updated with new features</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Installation & Connection Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <installStatus.icon className={`w-4 h-4 ${installStatus.color}`} />
            <span className="text-sm font-medium text-gray-700">{installStatus.text}</span>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-red-600" />}
            <span className={`text-xs ${isOnline ? "text-green-600" : "text-red-600"}`}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {/* Current Version Info */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-800">Current Version</h4>
              <p className="text-sm text-gray-600">Daily Budget {currentVersion}</p>
              <p className="text-xs text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              {updateAvailable ? (
                <Badge className="bg-orange-100 text-orange-800">Update Available</Badge>
              ) : (
                <Badge className="bg-green-100 text-green-800">Latest</Badge>
              )}
            </div>
          </div>

          {/* Update Progress */}
          {isDownloading && (
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Downloading update...</span>
                <span className="text-sm text-gray-600">{updateProgress}%</span>
              </div>
              <Progress value={updateProgress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={checkForUpdates}
              variant="outline"
              className="w-full bg-white hover:bg-green-50"
              disabled={isCheckingUpdates || !isOnline}
            >
              {isCheckingUpdates ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking for Updates...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check for Updates
                </>
              )}
            </Button>

            <Button
              onClick={downloadLatestVersion}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              disabled={isDownloading || !isOnline || (!updateAvailable && !isCheckingUpdates)}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Downloading Update...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Latest App
                </>
              )}
            </Button>
          </div>

          {/* Status Messages */}
          {updateStatus && (
            <div
              className={`text-sm p-3 rounded-lg mt-3 flex items-center gap-2 ${
                updateStatus.type === "success"
                  ? "bg-green-100 text-green-800"
                  : updateStatus.type === "error"
                    ? "bg-red-100 text-red-800"
                    : updateStatus.type === "warning"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
              }`}
            >
              {updateStatus.type === "success" && <CheckCircle className="w-4 h-4" />}
              {updateStatus.type === "error" && <AlertCircle className="w-4 h-4" />}
              {updateStatus.type === "warning" && <AlertCircle className="w-4 h-4" />}
              {updateStatus.type === "info" && <Download className="w-4 h-4" />}
              {updateStatus.message}
            </div>
          )}
        </div>

        {/* Update History */}
        <div className="bg-white p-3 rounded-lg border">
          <h4 className="font-medium text-gray-800 mb-2">Recent Updates</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">v35 - Enhanced PWA Updates</span>
              <span className="text-xs text-green-600 font-medium">Current</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">v34 - Fixed SSR Issues</span>
              <span className="text-xs text-gray-500">Previous</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">v33 - Enhanced Notifications</span>
              <span className="text-xs text-gray-500">Previous</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">v32 - Saturday Default Bills</span>
              <span className="text-xs text-gray-500">Previous</span>
            </div>
          </div>
        </div>

        {/* Auto-update Settings */}
        <div className="bg-white p-3 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">Auto-Update</h4>
              <p className="text-xs text-gray-600">Automatically check for updates on app start</p>
            </div>
            <Checkbox checked={autoUpdateEnabled} onCheckedChange={setAutoUpdateEnabled} />
          </div>
        </div>

        {/* PWA Installation Tip */}
        {!isPWAInstalled && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 text-sm">Install as App</h4>
                <p className="text-xs text-blue-600 mt-1">
                  Install this PWA on your device for the best update experience and offline access.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
