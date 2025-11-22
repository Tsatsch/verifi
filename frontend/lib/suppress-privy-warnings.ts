/**
 * Suppresses React key prop warnings from Privy's internal components
 * This is a known issue with Privy v3.7.0 and React 19
 * 
 * This file should be imported early in the app lifecycle
 */

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error
  const originalWarn = console.warn

  const shouldSuppress = (...args: unknown[]): boolean => {
    // Convert all args to strings for checking
    const allMessages = args
      .map((arg) => {
        if (typeof arg === "string") return arg
        if (arg && typeof arg === "object") {
          try {
            return JSON.stringify(arg)
          } catch {
            return String(arg)
          }
        }
        return String(arg)
      })
      .join(" ")

    // Check for the specific Privy key prop warning pattern
    if (
      allMessages.includes("Each child in a list should have a unique") &&
      allMessages.includes("key") &&
      (allMessages.includes("PrivyProvider") ||
        allMessages.includes("privy-provider") ||
        allMessages.includes("Sg") ||
        allMessages.includes("Fragment"))
    ) {
      return true
    }

    return false
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
}

