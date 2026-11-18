import { useEffect, useState } from 'react'

// Returns `value`, but only after it has stopped changing for `delay` ms.
// Typing "asha" quickly → the debounced value goes "" → "asha" once, so the
// search request fires once instead of on every keystroke.
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    // A new keystroke before the delay cancels the pending update.
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
