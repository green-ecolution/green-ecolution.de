import { trackEvent } from '../lib/track'

const RESET_DELAY_MS = 2000

let page: AbortController | null = null

export function setup() {
  // The ClientRouter swaps the document but keeps window, so the previous
  // page's buttons have to be released before the new ones are bound.
  page?.abort()
  page = new AbortController()
  const { signal } = page

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy]')) {
    const source = document.getElementById(button.dataset.copy ?? '')
    const label = button.querySelector('[data-copy-label]')
    const idleLabel = label?.textContent ?? ''
    const doneLabel = button.dataset.copiedLabel ?? idleLabel
    let timer = 0

    const copy = async () => {
      const text = source?.textContent?.trim()
      if (!text) {
        return
      }

      try {
        await navigator.clipboard.writeText(text)
      } catch {
        // No permission, or an insecure origin. Leaving the label untouched
        // is honest: nothing landed in the clipboard.
        return
      }
      trackEvent('text_copy', { text: button.dataset.copy ?? '' })

      if (label) {
        label.textContent = doneLabel
        window.clearTimeout(timer)
        timer = window.setTimeout(() => {
          label.textContent = idleLabel
        }, RESET_DELAY_MS)
      }
    }

    button.addEventListener('click', () => void copy(), { signal })

    signal.addEventListener('abort', () => window.clearTimeout(timer))
  }
}

// Fires on the first load and after every ClientRouter navigation.
document.addEventListener('astro:page-load', setup)
