"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, BellRing, CheckCircle, XCircle, AlertTriangle, Zap, RefreshCw, Settings } from "lucide-react"

// Safe number formatting
const safeToLocaleString = (value: any): string => {
  const num = Number(value)
  return isNaN(num) ? "0" : num.toLocaleString()
}

interface NotificationManagerProps {
  weeklyPayables: any[]
  dailyIncome: any[]
  currency: string
}

export default function NotificationManager({ weeklyPayables, dailyIncome, currency }: NotificationManagerProps) {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<string>("checking")
  const [registrationStatus, setRegistrationStatus] = useState<string[]>([])
  const [testResults, setTestResults] = useState<any[]>([])
  const [isTestingNotifications, setIsTestingNotifications] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    billReminders: true,
    goalReminders: true,
    dailyCheckins: true,
    weeklyReports: true,
  })

  // Load notification settings
  useEffect(() => {
    const saved = localStorage.getItem("notificationSettings")
    if (saved) {
      try {
        setNotificationSettings(JSON.parse(saved))
      } catch {
        // Use defaults
      }
    }
  }, [])

  // Save notification settings
  useEffect(() => {
    localStorage.setItem("notificationSettings", JSON.stringify(notificationSettings))
  }, [notificationSettings])

  // Check notification permission and service worker status
  useEffect(() => {
    checkNotificationSupport()
    checkServiceWorkerStatus()
  }, [])

  const checkNotificationSupport = async () => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
    }
  }

  const checkServiceWorkerStatus = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          setServiceWorkerStatus("registered")
          addRegistrationStatus("✅ Service Worker found and registered")
        } else {
          setServiceWorkerStatus("not-registered")
          addRegistrationStatus("❌ Service Worker not registered")
        }
      } catch (error) {
        setServiceWorkerStatus("error")
        addRegistrationStatus(`❌ Service Worker error: ${error}`)
      }
    } else {
      setServiceWorkerStatus("not-supported")
      addRegistrationStatus("❌ Service Worker not supported")
    }
  }

  const addRegistrationStatus = (status: string) => {
    setRegistrationStatus((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${status}`])
  }

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission()
        setNotificationPermission(permission)
        addRegistrationStatus(`📱 Permission result: ${permission}`)
        return permission === "granted"
      } catch (error) {
        addRegistrationStatus(`❌ Permission error: ${error}`)
        return false
      }
    }
    return false
  }

  // Enhanced service worker registration with multiple strategies
  const registerServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) {
      addRegistrationStatus("❌ Service Worker not supported")
      return false
    }

    const strategies = [
      // Strategy 1: Check existing registration
      async () => {
        const existing = await navigator.serviceWorker.getRegistration()
        if (existing) {
          addRegistrationStatus("✅ Strategy 1: Found existing registration")
          return existing
        }
        throw new Error("No existing registration")
      },

      // Strategy 2: Simple registration
      async () => {
        const registration = await navigator.serviceWorker.register("/sw.js")
        addRegistrationStatus("✅ Strategy 2: Simple registration successful")
        return registration
      },

      // Strategy 3: Registration with options
      async () => {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })
        addRegistrationStatus("✅ Strategy 3: Registration with options successful")
        return registration
      },

      // Strategy 4: Inline service worker creation
      async () => {
        const swCode = `
          self.addEventListener('notificationclick', function(event) {
            event.notification.close();
            event.waitUntil(
              clients.openWindow('/')
            );
          });
          
          self.addEventListener('push', function(event) {
            const options = {
              body: event.data ? event.data.text() : 'Budget reminder',
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              vibrate: [200, 100, 200],
              tag: 'budget-notification'
            };
            
            event.waitUntil(
              self.registration.showNotification('Daily Budget', options)
            );
          });
        `

        const blob = new Blob([swCode], { type: "application/javascript" })
        const swUrl = URL.createObjectURL(blob)
        const registration = await navigator.serviceWorker.register(swUrl)
        addRegistrationStatus("✅ Strategy 4: Inline service worker created")
        return registration
      },
    ]

    for (let i = 0; i < strategies.length; i++) {
      try {
        addRegistrationStatus(`🔄 Trying strategy ${i + 1}...`)
        const registration = await strategies[i]()
        await waitForServiceWorkerReady(registration)
        setServiceWorkerStatus("registered")
        return registration
      } catch (error) {
        addRegistrationStatus(`❌ Strategy ${i + 1} failed: ${error}`)
        continue
      }
    }

    setServiceWorkerStatus("failed")
    return null
  }

  const waitForServiceWorkerReady = async (registration: ServiceWorkerRegistration) => {
    return new Promise<void>((resolve) => {
      if (registration.active) {
        resolve()
        return
      }

      const worker = registration.installing || registration.waiting
      if (worker) {
        worker.addEventListener("statechange", () => {
          if (worker.state === "activated") {
            resolve()
          }
        })
      } else {
        resolve()
      }
    })
  }

  // Enhanced notification testing with multiple methods
  const testNotifications = async () => {
    setIsTestingNotifications(true)
    setTestResults([])

    const addTestResult = (method: string, success: boolean, message: string) => {
      setTestResults((prev) => [
        ...prev,
        {
          method,
          success,
          message,
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
    }

    // Test 1: Direct browser notification
    try {
      if (notificationPermission === "granted") {
        const notification = new Notification("Test Notification", {
          body: "Direct browser notification test",
          icon: "/icon-192x192.png",
          tag: "test-direct",
        })
        setTimeout(() => notification.close(), 3000)
        addTestResult("Direct Browser", true, "Direct notification sent successfully")
      } else {
        addTestResult("Direct Browser", false, "Permission not granted")
      }
    } catch (error) {
      addTestResult("Direct Browser", false, `Error: ${error}`)
    }

    // Test 2: Service Worker notification
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.showNotification("Service Worker Test", {
          body: "Service worker notification test",
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          vibrate: [200, 100, 200],
          tag: "test-sw",
        })
        addTestResult("Service Worker", true, "Service worker notification sent")
      } else {
        addTestResult("Service Worker", false, "No service worker registration")
      }
    } catch (error) {
      addTestResult("Service Worker", false, `Error: ${error}`)
    }

    // Test 3: Manual trigger with registration
    try {
      const registration = await registerServiceWorker()
      if (registration) {
        await registration.showNotification("Manual Registration Test", {
          body: "Manual registration notification test",
          icon: "/icon-192x192.png",
          tag: "test-manual",
        })
        addTestResult("Manual Registration", true, "Manual registration notification sent")
      } else {
        addTestResult("Manual Registration", false, "Registration failed")
      }
    } catch (error) {
      addTestResult("Manual Registration", false, `Error: ${error}`)
    }

    setIsTestingNotifications(false)
  }

  // Send bill reminder notifications
  const sendBillReminders = async () => {
    if (!notificationSettings.billReminders) return

    const pendingBills = weeklyPayables.filter((bill) => bill.status === "pending")
    if (pendingBills.length === 0) return

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      const totalAmount = pendingBills.reduce((sum, bill) => sum + (bill.amount || 0), 0)

      const notificationOptions = {
        body: `You have ${pendingBills.length} pending bills totaling ${currency}${safeToLocaleString(totalAmount)}`,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        vibrate: [200, 100, 200, 100, 200],
        tag: "bill-reminder",
        actions: [
          {
            action: "view",
            title: "View Bills",
          },
          {
            action: "dismiss",
            title: "Dismiss",
          },
        ],
      }

      if (registration) {
        await registration.showNotification("Bill Reminder", notificationOptions)
      } else {
        // Fallback to direct notification
        new Notification("Bill Reminder", notificationOptions)
      }
    } catch (error) {
      console.error("Bill reminder notification failed:", error)
    }
  }

  // Send goal reminder notifications
  const sendGoalReminders = async () => {
    if (!notificationSettings.goalReminders) return

    const today = dailyIncome.find((day) => day.isToday)
    if (!today || !today.isWorkDay) return

    const progress = today.goal > 0 ? (today.amount / today.goal) * 100 : 0

    if (progress < 50) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        const remaining = today.goal - today.amount

        const notificationOptions = {
          body: `You're at ${progress.toFixed(0)}% of today's goal. ${currency}${safeToLocaleString(remaining)} remaining.`,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          vibrate: [200, 100, 200],
          tag: "goal-reminder",
        }

        if (registration) {
          await registration.showNotification("Goal Reminder", notificationOptions)
        } else {
          new Notification("Goal Reminder", notificationOptions)
        }
      } catch (error) {
        console.error("Goal reminder notification failed:", error)
      }
    }
  }

  // Calculate notification stats
  const pendingBills = weeklyPayables.filter((bill) => bill.status === "pending")
  const totalPendingAmount = pendingBills.reduce((sum, bill) => sum + (bill.amount || 0), 0)
  const todayIncome = dailyIncome.find((day) => day.isToday)
  const todayProgress = todayIncome && todayIncome.goal > 0 ? (todayIncome.amount / todayIncome.goal) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Notification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Notification Status
          </CardTitle>
          <CardDescription>Enhanced notification system with multiple fallbacks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Permission</span>
                <Badge
                  className={
                    notificationPermission === "granted"
                      ? "bg-green-100 text-green-800"
                      : notificationPermission === "denied"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {notificationPermission}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Service Worker</span>
                <Badge
                  className={
                    serviceWorkerStatus === "registered"
                      ? "bg-green-100 text-green-800"
                      : serviceWorkerStatus === "checking"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {serviceWorkerStatus}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Bills</span>
                <Badge className="bg-orange-100 text-orange-800">{pendingBills.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Today's Progress</span>
                <Badge
                  className={
                    todayProgress >= 100
                      ? "bg-green-100 text-green-800"
                      : todayProgress >= 50
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {todayProgress.toFixed(0)}%
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {notificationPermission !== "granted" && (
              <Button onClick={requestNotificationPermission} size="sm" className="flex-1">
                <BellRing className="w-4 h-4 mr-2" />
                Enable Notifications
              </Button>
            )}
            <Button onClick={testNotifications} size="sm" className="flex-1" disabled={isTestingNotifications}>
              {isTestingNotifications ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Test All Systems
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            Notification Settings
          </CardTitle>
          <CardDescription>Configure when you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Bill Reminders</Label>
                <p className="text-xs text-gray-600">Notify about pending bills</p>
              </div>
              <Switch
                checked={notificationSettings.billReminders}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, billReminders: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Goal Reminders</Label>
                <p className="text-xs text-gray-600">Notify when behind on daily goals</p>
              </div>
              <Switch
                checked={notificationSettings.goalReminders}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, goalReminders: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Daily Check-ins</Label>
                <p className="text-xs text-gray-600">Daily income tracking reminders</p>
              </div>
              <Switch
                checked={notificationSettings.dailyCheckins}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, dailyCheckins: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Weekly Reports</Label>
                <p className="text-xs text-gray-600">Weekly progress summaries</p>
              </div>
              <Switch
                checked={notificationSettings.weeklyReports}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, weeklyReports: checked })
                }
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={sendBillReminders} size="sm" className="flex-1 bg-transparent" variant="outline">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Test Bill Reminder
            </Button>
            <Button onClick={sendGoalReminders} size="sm" className="flex-1 bg-transparent" variant="outline">
              <CheckCircle className="w-4 h-4 mr-2" />
              Test Goal Reminder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Registration Status Log */}
      {registrationStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Registration Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {registrationStatus.map((status, index) => (
                <div key={index} className="text-xs font-mono bg-gray-50 p-2 rounded">
                  {status}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">{result.method}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">{result.timestamp}</div>
                    <div className="text-xs">{result.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={checkServiceWorkerStatus} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
            <Button onClick={registerServiceWorker} size="sm" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Re-register SW
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
