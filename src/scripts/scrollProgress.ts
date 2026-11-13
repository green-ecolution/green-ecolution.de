import { reachableRange, scrollProgress } from '../lib/scrollProgress'

const DEFAULT_START = 0.85
const DEFAULT_END = 0.5

let page: AbortController | null = null

// Writes how far each [data-scroll-progress] element has travelled through the
// window to --scroll-progress. Styles fall back to 1, so without the script,
// and with reduced motion, everything stands in its final state.
function setup() {
  page?.abort()
  page = new AbortController()
  const { signal } = page

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const elements = [...document.querySelectorAll<HTMLElement>('[data-scroll-progress]')]
  if (elements.length === 0) return

  let frame = 0
  const update = () => {
    frame = 0
    const viewport = window.innerHeight
    const scrollLeft = document.documentElement.scrollHeight - viewport - window.scrollY
    for (const element of elements) {
      const rect = element.getBoundingClientRect()
      const range = reachableRange(
        {
          start: Number(element.dataset.progressStart ?? DEFAULT_START),
          end: Number(element.dataset.progressEnd ?? DEFAULT_END),
        },
        (rect.bottom - scrollLeft) / viewport,
      )
      const progress = scrollProgress(rect.top, rect.height, viewport, range)
      element.style.setProperty('--scroll-progress', progress.toFixed(3))
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
