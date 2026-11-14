import { useEffect, useState, type RefObject } from 'react'

// True until the browser says otherwise, so nothing waits for the first report.
export function useOnScreen(target: RefObject<Element | null>): boolean {
  const [isOnScreen, setIsOnScreen] = useState(true)

  useEffect(() => {
    const element = target.current
    if (!element) return

    const viewport = new IntersectionObserver(([entry]) => setIsOnScreen(entry.isIntersecting))
    viewport.observe(element)

    return () => viewport.disconnect()
  }, [target])

  return isOnScreen
}
