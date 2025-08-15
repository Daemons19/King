"use client"

import type React from "react"

import { useEffect } from "react"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("SW registered: ", registration)

          // Check for updates immediately
          registration.update()

          // Listen for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New version available
                  console.log("New version available!")
                }
              })
            }
          })
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError)
        })
    }

    // Handle PWA install prompt
    let deferredPrompt: any
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault()
      deferredPrompt = e
    })

    // Handle app installed
    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed")
      deferredPrompt = null
    })
  }, [])

  return <>{children}</>
}
