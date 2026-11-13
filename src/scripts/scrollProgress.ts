import { reachableRange, scrollProgress, type ProgressRange } from '../lib/scrollProgress'

const DEFAULT_RANGE: ProgressRange = { start: 0.85, end: 0.5 }
// The short rules under the section labels grow while they travel up the lower
// part of the window. There are dozens of them, so they carry no attributes.
const RULE_SELECTOR = '.label-rule'
const RULE_RANGE: ProgressRange = { start: 0.92, end: 0.68 }

interface Tracked {
  element: HTMLElement
  range: ProgressRange
  written: string
}

let page: AbortController | null = null

function rangeOf(element: HTMLElement): ProgressRange {
  if (!element.hasAttribute('data-scroll-progress')) return RULE_RANGE
  return {
    start: Number(element.dataset.progressStart ?? DEFAULT_RANGE.start),
    end: Number(element.dataset.progressEnd ?? DEFAULT_RANGE.end),
  }
}

// Writes how far each tracked element has travelled through the window to
// --scroll-progress. Styles fall back to 1, so without the script, and with
// reduced motion, everything stands in its final state.
function setup() {
  page?.abort()
  page = new AbortController()
  const { signal } = page

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const tracked: Tracked[] = [
    ...document.querySelectorAll<HTMLElement>(`[data-scroll-progress], ${RULE_SELECTOR}`),
  ]
    // React owns the markup inside an island and would not expect the style.
    .filter((element) => !element.closest('astro-island'))
    .map((element) => ({ element, range: rangeOf(element), written: '' }))
  if (tracked.length === 0) return

  let frame = 0
  const update = () => {
    frame = 0
    const viewport = window.innerHeight
    const scrollLeft = document.documentElement.scrollHeight - viewport - window.scrollY
    for (const item of tracked) {
      const rect = item.element.getBoundingClientRect()
      const range = reachableRange(item.range, (rect.bottom - scrollLeft) / viewport)
      const progress = scrollProgress(rect.top, rect.height, viewport, range).toFixed(3)
      if (progress === item.written) continue
      item.written = progress
      item.element.style.setProperty('--scroll-progress', progress)
    }
  }
  const schedule = () => {
    if (frame === 0) frame = window.requestAnimationFrame(update)
  }

  window.addEventListener('scroll', schedule, { passive: true, signal })
  window.addEventListener('resize', schedule, { signal })
  signal.addEventListener('abort', () => {
    if (frame !== 0) window.cancelAnimationFrame(frame)
  })
  update()
}

document.addEventListener('astro:page-load', setup)
