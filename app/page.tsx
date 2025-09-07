"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(true)

  useEffect(() => {
    const handleRedirect = () => {
      try {
        const token = localStorage.getItem("token")
        if (token) {
          router.push("/dashboard")
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Redirect error:", error)
        // Fallback to login page if there's any error
        router.push("/login")
      }
    }

    // Add a small delay to ensure the router is ready
    const timer = setTimeout(() => {
      handleRedirect()
    }, 100)

    // Add a fallback timeout in case redirect fails
    const fallbackTimer = setTimeout(() => {
      console.log("Redirect timeout, forcing navigation to login")
      router.push("/login")
    }, 3000)

    return () => {
      clearTimeout(timer)
      clearTimeout(fallbackTimer)
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    </div>
  )
}
