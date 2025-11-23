import { useCallback, useEffect, useRef } from 'react'

/**
 * Creates a ref that can be awaited until it has a value.
 *
 * This hook handles the common pattern of waiting for asynchronously-provided
 * context values (like provider info, storage contexts, or auth state) that may
 * not be immediately available when a component mounts or a callback is created.
 */
export function useWaitableRef<T>(value: T | null) {
  const ref = useRef<T | null>(value)
  const resolver = useRef<((v: T) => void) | null>(null)
  const promiseRef = useRef<Promise<T> | null>(null)

  useEffect(() => {
    ref.current = value

    if (value != null && resolver.current) {
      resolver.current(value)
      resolver.current = null
      promiseRef.current = null
    }
  }, [value])

  const wait = useCallback(() => {
    if (promiseRef.current) return promiseRef.current

    if (ref.current != null) {
      return Promise.resolve(ref.current)
    }

    promiseRef.current = new Promise<T>((resolve) => {
      resolver.current = (v) => {
        resolver.current = null
        resolve(v)
      }
    })

    return promiseRef.current
  }, [])

  return { ref, wait }
}

