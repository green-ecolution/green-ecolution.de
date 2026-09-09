import { useEffect, type RefObject } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

// A dialog that only looks modal still lets tab focus walk into the page behind
// it, which leaves the reader somewhere they cannot see. This keeps the cycle
// inside the container and hands focus back to whatever opened it.
export function useDialogFocus(ref: RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    const container = ref.current
    if (!open || !container) return

    const previous = document.activeElement as HTMLElement | null

    const targets = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.closest('[inert]') === null,
      )

    targets()[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const items = targets()
      if (items.length === 0) return

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !container.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [ref, open])
}
