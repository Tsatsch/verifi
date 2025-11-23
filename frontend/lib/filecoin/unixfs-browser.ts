'use client'

/**
 * Browser-specific wrapper for filecoin-pin unixfs
 * Uses lazy loading to avoid SSR evaluation issues
 */

// Lazy load the browser module - only loads when actually called in browser
// Use the package export path - webpack will resolve it via alias to browser version
let browserModulePromise: Promise<typeof import('filecoin-pin/core/unixfs')> | null = null

function getBrowserModule() {
  if (typeof window === 'undefined') {
    throw new Error('createCarFromFile can only be used in browser context')
  }
  if (!browserModulePromise) {
    // Dynamic import - webpack alias will resolve 'filecoin-pin/core/unixfs' to browser version
    // The alias in next.config.mjs ensures this resolves to browser.js in client builds
    browserModulePromise = import('filecoin-pin/core/unixfs')
  }
  return browserModulePromise
}

// Re-export with same API but lazy-loaded implementation
// These functions return Promises, matching the original API
export async function createCarFromFile(file: File, options?: any) {
  const module = await getBrowserModule()
  return module.createCarFromFile(file, options)
}

export async function createCarFromFiles(files: File[], options?: any) {
  const module = await getBrowserModule()
  return module.createCarFromFiles(files, options)
}

export async function createCarFromFileList(files: File[], options?: any) {
  const module = await getBrowserModule()
  return module.createCarFromFileList(files, options)
}

