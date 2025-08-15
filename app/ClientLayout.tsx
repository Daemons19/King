"use client"

import type React from "react"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { useEffect } from "react"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  useEffect(() => {
    const checkAutoUpdate = async () => {
      const autoUpdateEnabled = localStorage.getItem("autoUpdateEnabled")
      if (autoUpdateEnabled === "false") return

      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            // Check for updates silently
            await registration.update()
          }
        } catch (error) {
          console.log("Auto-update check failed:", error)
        }
      }
    }

    // Check for updates 5 seconds after app loads
    const timer = setTimeout(checkAutoUpdate, 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
