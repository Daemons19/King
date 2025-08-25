"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bell,
  BellRing,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  Settings,
  TestTube,
} from "lucide-react"

// Safe localStorage access
const safeLocalStorage = {
  getItem: (key: string) => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key)
    }
    return null
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value)
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key)
    }
  },
}

// Helper function to get current Manila time
const getManilaTime = () => {
  return new Date().toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

// Helper function to get current day of week in Manila
const getCurrentDayManila = () => {
  return new Date().toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    weekday: "short",
  })
}

// Helper function to check if we're in a PWA
const isPWA = () => {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes("android-app://")
  )
}

// Enhanced Service Worker registration with multiple fallback strategies
const registerServiceWorkerWithFallbacks = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    throw new Error("Service Worker not supported")
  }

  const strategies = [
    // Strategy 1: Try to get existing registration
    async () => {
      const existing = await navigator.serviceWorker.getRegistration()
      if (existing && existing.active) {
        return existing
      }
      throw new Error("No active registration found")
    },

    // Strategy 2: Register main service worker
    async () => {
      return await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })
    },

    // Strategy 3: Create inline service worker as fallback
    async () => {
      const swCode = `
        self.addEventListener('notificationclick', function(event) {
          event.notification.close();
          event.waitUntil(
            clients.matchAll().then(function(clientList) {
              if (clientList.length > 0) {
                return clientList[0].focus();
              }
              return clients.openWindow('/');
            })
          );
        });
        
        self.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
            const { title, options } = event.data;
            self.registration.showNotification(title, options);
          }
        });
      `

      const blob = new Blob([swCode], { type: "application/javascript" })
      const swUrl = URL.createObjectURL(blob)

      return await navigator.serviceWorker.register(swUrl, {
        scope: "/",
        updateViaCache: "none",
      })
    },
  ]

  for (let i = 0; i < strategies.length; i++) {
    try {
      const registration = await strategies[i]()
      console.log(`Service Worker registered successfully with strategy ${i + 1}`)
      return registration
    } catch (error) {
      console.log(`Strategy ${i + 1} failed:`, error)
      if (i === strategies.length - 1) {
        throw error
      }
    }
  }

  return null
}

// Wait for service worker to be ready with timeout
const waitForServiceWorkerReady = async (registration: ServiceWorkerRegistration, timeout = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Service Worker ready timeout"))
    }, timeout)

    const checkReady = () => {
      if (registration.active) {
        clearTimeout(timeoutId)
        resolve()
        return
      }

      if (registration.installing) {
        registration.installing.addEventListener("statechange", function handler() {
          if (this.state === "activated") {
            this.removeEventListener("statechange", handler)
            clearTimeout(timeoutId)
            resolve()
          } else if (this.state === "redundant") {
            this.removeEventListener("statechange", handler)
            clearTimeout(timeoutId)
            reject(new Error("Service Worker became redundant"))
          }
        })
      } else if (registration.waiting) {
        // Force activate waiting service worker
        registration.waiting.postMessage({ type: "SKIP_WAITING" })
        registration.waiting.addEventListener("statechange", function handler() {
          if (this.state === "activated") {
            this.removeEventListener("statechange", handler)
            clearTimeout(timeoutId)
            resolve()
          }
        })
      } else {
        clearTimeout(timeoutId)
        reject(new Error("No service worker found"))
      }
    }

    checkReady()
  })
}

interface NotificationManagerProps {
  weeklyPayables: any[]
  dailyIncome: any[]
  currency: string
}

export default function NotificationManager({ weeklyPayables, dailyIncome, currency }: NotificationManagerProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false)
  const [serviceWorkerActive, setServiceWorkerActive] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationAttempts, setRegistrationAttempts] = useState(0)
  const [fallbackEnabled, setFallbackEnabled] = useState(false)
  const [debugLog, setDebugLog] = useState<string[]>([])

  // Notification settings
  const [settings, setSettings] = useState({
    dailyReminders: true,
    payableReminders: true,
    goalAlerts: true,
    reminderTime: "09:00",
    payableHours: 24,
  })

  const addToDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLog((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)])
  }

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = safeLocalStorage.getItem("notificationSettings")
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error("Error loading notification settings:", error)
      }
    }

    // Check initial permission
    if ("Notification" in window) {
      setPermission(Notification.permission)
    }

    // Check if fallback was previously enabled
    const fallbackSetting = safeLocalStorage.getItem("notificationFallback")
    if (fallbackSetting === "true") {
      setFallbackEnabled(true)
      addToDebugLog("Fallback mode enabled from previous session")
    }
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    safeLocalStorage.setItem("notificationSettings", JSON.stringify(settings))
  }, [settings])

  // Initialize service worker
  useEffect(() => {
    if (fallbackEnabled) {
      addToDebugLog("Skipping SW registration - fallback mode active")
      return
    }

    initializeServiceWorker()
  }, [fallbackEnabled])

  const initializeServiceWorker = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      setError("Service Worker not supported in this browser")
      addToDebugLog("Service Worker not supported")
      return
    }

    setIsRegistering(true)
    setError(null)
    addToDebugLog("Starting Service Worker registration...")

    try {
      const reg = await registerServiceWorkerWithFallbacks()
      if (!reg) {
        throw new Error("Failed to register service worker")
      }

      setRegistration(reg)
      addToDebugLog("Service Worker registered successfully")

      // Wait for service worker to be ready
      await waitForServiceWorkerReady(reg, 5000)

      setServiceWorkerReady(true)
      setServiceWorkerActive(!!reg.active)
      addToDebugLog("Service Worker is ready and active")

      // Force activation if needed
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" })
        addToDebugLog("Forced activation of waiting service worker")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(`Service Worker registration failed: ${errorMessage}`)
      addToDebugLog(`Registration failed: ${errorMessage}`)
      setRegistrationAttempts((prev) => prev + 1)

      // Auto-enable fallback after 3 failed attempts
      if (registrationAttempts >= 2) {
        addToDebugLog("Auto-enabling fallback after multiple failures")
        enableFallback()
      }
    } finally {
      setIsRegistering(false)
    }
  }

  const enableFallback = () => {
    setFallbackEnabled(true)
    setError(null)
    safeLocalStorage.setItem("notificationFallback", "true")
    addToDebugLog("Fallback mode enabled - using direct notifications")
  }

  const disableFallback = () => {
    setFallbackEnabled(false)
    safeLocalStorage.removeItem("notificationFallback")
    addToDebugLog("Fallback mode disabled - will try Service Worker")
    initializeServiceWorker()
  }

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      setError("Notifications not supported in this browser")
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      addToDebugLog(`Notification permission: ${result}`)

      if (result === "granted") {
        setNotificationsEnabled(true)
        setError(null)
        return true
      } else {
        setError("Notification permission denied")
        return false
      }
    } catch (error) {
      setError("Failed to request notification permission")
      addToDebugLog("Permission request failed")
      return false
    }
  }

  const sendNotification = async (title: string, options: NotificationOptions = {}) => {
    if (permission !== "granted") {
      addToDebugLog("Cannot send notification - permission not granted")
      return
    }

    const notificationOptions = {
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      tag: "budget-app",
      requireInteraction: false,
      ...options,
    }

    try {
      if (fallbackEnabled || !serviceWorkerReady) {
        // Use direct notification
        new Notification(title, notificationOptions)
        addToDebugLog(`Direct notification sent: ${title}`)
      } else if (registration && serviceWorkerActive) {
        // Use service worker
        if (registration.active) {
          registration.active.postMessage({
            type: "SHOW_NOTIFICATION",
            title,
            options: notificationOptions,
          })
          addToDebugLog(`SW notification sent: ${title}`)
        } else {
          throw new Error("Service worker not active")
        }
      } else {
        throw new Error("No notification method available")
      }
    } catch (error) {
      addToDebugLog(`Notification failed: ${error}`)
      // Fallback to direct notification
      if (!fallbackEnabled) {
        new Notification(title, notificationOptions)
        addToDebugLog("Used direct notification as fallback")
      }
    }
  }

  const sendTestNotification = async () => {
    if (permission !== "granted") {
      const granted = await requestNotificationPermission()
      if (!granted) return
    }

    await sendNotification("🧪 Test Notification", {
      body: `Sent at ${getManilaTime()} - Your notifications are working!`,
      icon: "/icon-192x192.png",
    })
  }

  const sendDailyReminder = async () => {
    const today = getCurrentDayManila()
    const todayData = dailyIncome.find((day) => day.day === today)

    if (todayData && todayData.isWorkDay) {
      await sendNotification("💰 Daily Earning Reminder", {
        body: `Today's goal: ${currency}${todayData.goal.toLocaleString()}. Current: ${currency}${todayData.amount.toLocaleString()}`,
      })
    }
  }

  const sendPayableReminder = async (payable: any) => {
    await sendNotification("💳 Bill Reminder", {
      body: `${payable.name} - ${currency}${payable.amount.toLocaleString()} due ${payable.dueDay}`,
    })
  }

  const sendGoalAlert = async (message: string) => {
    await sendNotification("🎯 Goal Alert", {
      body: message,
    })
  }

  // Auto-send notifications based on settings
  useEffect(() => {
    if (!notificationsEnabled || permission !== "granted") return

    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)

    // Daily reminders
    if (settings.dailyReminders && currentTime === settings.reminderTime) {
      sendDailyReminder()
    }

    // Payable reminders
    if (settings.payableReminders) {
      weeklyPayables
        .filter((p) => p.status === "pending")
        .forEach((payable) => {
          // Send reminder based on payableHours setting
          const dueDate = new Date() // This would need proper date calculation
          const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)

          if (hoursUntilDue <= settings.payableHours && hoursUntilDue > 0) {
            sendPayableReminder(payable)
          }
        })
    }
  }, [notificationsEnabled, settings, weeklyPayables, dailyIncome])

  const getStatusBadge = () => {
    if (fallbackEnabled) {
      return <Badge className="bg-orange-100 text-orange-800">Direct</Badge>
    }
    if (serviceWorkerReady && serviceWorkerActive) {
      return <Badge className="bg-green-100 text-green-800">SW Ready</Badge>
    }
    if (serviceWorkerReady) {
      return <Badge className="bg-blue-100 text-blue-800">SW Active</Badge>
    }
    if (isRegistering) {
      return <Badge className="bg-yellow-100 text-yellow-800">Registering...</Badge>
    }
    return <Badge className="bg-red-100 text-red-800">Not Ready</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Enhanced Notifications
            </div>
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            {isPWA() ? "PWA Mode" : "Browser Mode"} • Permission: {permission}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Permission & Enable */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Notifications</Label>
              <p className="text-xs text-gray-600">Allow the app to send you reminders</p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={async (checked) => {
                if (checked) {
                  const granted = await requestNotificationPermission()
                  setNotificationsEnabled(granted)
                } else {
                  setNotificationsEnabled(false)
                }
              }}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="w-4 h-4" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={initializeServiceWorker} disabled={isRegistering}>
                  <RefreshCw className={`w-3 h-3 mr-1 ${isRegistering ? "animate-spin" : ""}`} />
                  Retry Registration
                </Button>
                {!fallbackEnabled && (
                  <Button size="sm" variant="outline" onClick={enableFallback}>
                    <Zap className="w-3 h-3 mr-1" />
                    Enable Fallback
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Fallback Mode */}
          {fallbackEnabled && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Fallback Mode Active</span>
              </div>
              <p className="text-sm text-orange-700 mt-1">Using direct notifications (no Service Worker required)</p>
              <Button size="sm" variant="outline" onClick={disableFallback} className="mt-2 bg-transparent">
                <Settings className="w-3 h-3 mr-1" />
                Try Service Worker Again
              </Button>
            </div>
          )}

          {/* Test Notification */}
          <div className="flex gap-2">
            <Button onClick={sendTestNotification} disabled={permission !== "granted"} className="flex-1">
              <TestTube className="w-4 h-4 mr-2" />🧪 Send Test Notification
            </Button>
          </div>

          {/* Debug Log */}
          {debugLog.length > 0 && (
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-800">Debug Log</span>
                <Button size="sm" variant="ghost" onClick={() => setDebugLog([])}>
                  Clear
                </Button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {debugLog.map((log, index) => (
                  <p key={index} className="text-xs text-gray-600 font-mono">
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      {notificationsEnabled && permission === "granted" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Daily Reminders</Label>
                  <p className="text-xs text-gray-600">Remind me about daily goals</p>
                </div>
                <Switch
                  checked={settings.dailyReminders}
                  onCheckedChange={(checked) => setSettings({ ...settings, dailyReminders: checked })}
                />
              </div>

              {settings.dailyReminders && (
                <div className="ml-4">
                  <Label>Reminder Time</Label>
                  <Input
                    type="time"
                    value={settings.reminderTime}
                    onChange={(e) => setSettings({ ...settings, reminderTime: e.target.value })}
                    className="w-32"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label>Bill Reminders</Label>
                  <p className="text-xs text-gray-600">Remind me about upcoming bills</p>
                </div>
                <Switch
                  checked={settings.payableReminders}
                  onCheckedChange={(checked) => setSettings({ ...settings, payableReminders: checked })}
                />
              </div>

              {settings.payableReminders && (
                <div className="ml-4">
                  <Label>Hours Before Due</Label>
                  <Select
                    value={settings.payableHours.toString()}
                    onValueChange={(value) => setSettings({ ...settings, payableHours: Number.parseInt(value) })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="6">6 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="48">48 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label>Goal Alerts</Label>
                  <p className="text-xs text-gray-600">Alert me about goal achievements</p>
                </div>
                <Switch
                  checked={settings.goalAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, goalAlerts: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {notificationsEnabled && permission === "granted" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-green-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={sendDailyReminder}>
                <Target className="w-3 h-3 mr-1" />
                Daily Reminder
              </Button>
              <Button size="sm" variant="outline" onClick={() => sendGoalAlert("Keep up the great work! 🎉")}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Goal Alert
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
