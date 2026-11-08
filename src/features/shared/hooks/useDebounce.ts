import { useEffect, useState } from 'react'

/**
 * Custom hook to debounce a fast-changing value (e.g. search query input).
 * Ensures instant local typing responsiveness while delaying expensive downstream
 * computations, URL navigations, and server query refetches.
 *
 * @param value The raw input value
 * @param delay Milliseconds to wait after last change before updating debounced value (default: 250ms)
 */
export function useDebounce<T>(value: T, delay = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
