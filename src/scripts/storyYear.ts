import { activeIndex } from '../lib/scrollProgress'

// Share of the window height a paragraph has to reach to count as being read.
const READING_LINE = 0.5

let page: AbortController | null = null

function setup() {
  page?.abort()
  page = new AbortController()
  const { signal } = page

  for (const root of document.querySelectorAll<HTMLElement>('[data-story]')) {
    const parts = [...root.querySelectorAll<HTMLElement>('[data-story-part]')]
    if (parts.length === 0) continue

    let frame = 0
    const update = () => {
      frame = 0
      const tops = parts.map((part) => part.getBoundingClientRect().top)
      const active = activeIndex(tops, window.innerHeight * READING_LINE)
      root.style.setProperty('--year-index', parts[active].dataset.yearIndex ?? '0')
      root.style.setProperty('--year-y', `${Math.round(tops[active] - tops[0])}px`)
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
    root.dataset.enhanced = ''
  }
}

document.addEventListener('astro:page-load', setup)
