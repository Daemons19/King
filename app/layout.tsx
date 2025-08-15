import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "Daily Budget Tracker v34",
  description: "Track your daily income, expenses, and weekly payables with real-time calculations",
  manifest: "/manifest.json",
  icons: {
    icon: "/placeholder-logo.png",
    apple: "/placeholder-logo.png",
  },
  themeColor: "#8B5CF6",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Auto-update check on app load
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', async () => {
                  try {
                    const autoUpdateEnabled = localStorage.getItem('autoUpdateEnabled');
                    if (autoUpdateEnabled === 'false') return;
                    
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    
                    // Check for updates silently after 5 seconds
                    setTimeout(async () => {
                      try {
                        await registration.update();
                      } catch (error) {
                        console.log('Auto-update check failed:', error);
                      }
                    }, 5000);
                  } catch (error) {
                    console.log('Service worker registration failed:', error);
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className={GeistSans.className}>{children}</body>
    </html>
  )
}
