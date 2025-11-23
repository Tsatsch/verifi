"use client"

import { useState, useEffect } from "react"

/**
 * Hook to detect when the CDP (Coinbase Developer Platform) sign-in modal is open.
 * Uses MutationObserver to watch for modal DOM elements.
 */
export function useCdpModalState() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Common selectors for CDP modal elements
    const modalSelectors = [
      '[data-cdp]',
      '[data-coinbase]',
      '[class*="cdp"]',
      '[class*="coinbase"]',
      '[id*="cdp"]',
      '[id*="coinbase"]',
      // CDP typically uses Radix Dialog, so look for dialog overlays
      '[role="dialog"]',
      // Look for portal containers that CDP might use
      'body > div[data-portal]',
      'body > div[id^="radix"]',
    ]

    const checkForModal = (): boolean => {
      // First, check for CDP-specific modal indicators
      // CDP uses Radix Dialog which has data-state="open" attribute
      const radixDialogs = document.querySelectorAll('[role="dialog"][data-state="open"]')
      if (radixDialogs.length > 0) {
        // Verify it's actually visible
        for (const dialog of radixDialogs) {
          const style = window.getComputedStyle(dialog)
          const rect = dialog.getBoundingClientRect()
          if (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            rect.width > 0 &&
            rect.height > 0
          ) {
            return true
          }
        }
      }

      // Check for overlay/backdrop elements (common in modals)
      const overlays = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-portal]')
      for (const overlay of overlays) {
        const style = window.getComputedStyle(overlay)
        const rect = overlay.getBoundingClientRect()
        if (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0' &&
          rect.width > 0 &&
          rect.height > 0 &&
          (style.position === 'fixed' || style.position === 'absolute')
        ) {
          // Check if it covers a significant portion of the screen (modal-like)
          if (rect.width >= window.innerWidth * 0.5 && rect.height >= window.innerHeight * 0.5) {
            return true
          }
        }
      }

      // Check for body scroll lock combined with high z-index elements
      const bodyStyle = window.getComputedStyle(document.body)
      const isBodyLocked = bodyStyle.overflow === 'hidden' || bodyStyle.position === 'fixed'
      
      if (isBodyLocked) {
        // Look for fixed position elements with high z-index that could be modals
        const allElements = document.querySelectorAll('*')
        for (const element of allElements) {
          const style = window.getComputedStyle(element)
          const zIndex = parseInt(style.zIndex) || 0
          
          // Check for elements with z-index >= 50 (above our buttons) that are fixed and visible
          if (zIndex >= 50 && style.position === 'fixed') {
            const rect = element.getBoundingClientRect()
            // Element should cover significant screen area to be considered a modal
            if (
              rect.width > 0 &&
              rect.height > 0 &&
              rect.width >= window.innerWidth * 0.3 &&
              rect.height >= window.innerHeight * 0.3 &&
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              style.opacity !== '0'
            ) {
              return true
            }
          }
        }
      }
      
      return false
    }

    // Initial check
    setIsModalOpen(checkForModal())

    // Use MutationObserver to watch for DOM changes
    const observer = new MutationObserver(() => {
      const modalOpen = checkForModal()
      setIsModalOpen(prev => {
        // Only update if state actually changed to avoid unnecessary re-renders
        if (prev !== modalOpen) {
          return modalOpen
        }
        return prev
      })
    })

    // Observe changes to the document body and its children
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-state', 'aria-hidden'],
    })

    // Also check periodically as a fallback (in case MutationObserver misses something)
    const interval = setInterval(() => {
      const modalOpen = checkForModal()
      setIsModalOpen(prev => {
        if (prev !== modalOpen) {
          return modalOpen
        }
        return prev
      })
    }, 200) // Check every 200ms

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  return isModalOpen
}
