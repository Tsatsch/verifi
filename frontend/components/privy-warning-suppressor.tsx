"use client"

import { useEffect } from "react"

/**
 * Suppresses React key prop warnings from Privy's internal components
 * This component should wrap PrivyProvider to catch warnings early
 */
export function PrivyWarningSuppressor() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const originalError = console.error
      const originalWarn = console.warn

      const shouldSuppress = (...args: unknown[]): boolean => {
        const allText = args
          .map((arg) => {
            if (typeof arg === "string") return arg
            try {
              return JSON.stringify(arg)
            } catch {
              return String(arg)
            }
          })
          .join(" ")

        return (
          allText.includes("Each child in a list should have a unique") &&
          allText.includes("key") &&
          (allText.includes("PrivyProvider") ||
            allText.includes("privy-provider") ||
            allText.includes("Sg") ||
            allText.includes("Fragment"))
        )
      }

      console.error = (...args: unknown[]) => {
        if (!shouldSuppress(...args)) {
          originalError(...args)
        }
      }

      console.warn = (...args: unknown[]) => {
        if (!shouldSuppress(...args)) {
          originalWarn(...args)
        }
      }

      return () => {
        console.error = originalError
        console.warn = originalWarn
      }
    }
  }, [])

  return null
}

