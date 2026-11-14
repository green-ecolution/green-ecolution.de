import { formatFigure, parseFigure } from '../lib/countUp'

const DURATION_MS = 1400

let page: AbortController | null = null

const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3

function run(element: HTMLElement, signal: AbortSignal) {
  const finalText = element.textContent?.trim() ?? ''
  const figure = parseFigure(finalText)
  if (!figure) return

  // Pinning the width keeps the cards from reflowing while the digits grow.
  element.style.minWidth = `${element.offsetWidth}px`
  const start = performance.now()
  let frame = 0

  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / DURATION_MS)
    element.textContent = formatFigure(figure, figure.value * easeOutCubic(progress))
    frame = progress < 1 ? window.requestAnimationFrame(tick) : 0
    if (progress === 1) element.textContent = finalText
  }

  signal.addEventListener('abort', () => {
    if (frame !== 0) window.cancelAnimationFrame(frame)
    element.textContent = finalText
  })
  element.textContent = formatFigure(figure, 0)
  frame = window.requestAnimationFrame(tick)
}

function setup() {
  page?.abort()
  page = new AbortController()
  const { signal } = page

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        observer.unobserve(entry.target)
        run(entry.target as HTMLElement, signal)
      }
    },
    { threshold: 0.6 },
  )

  for (const element of document.querySelectorAll<HTMLElement>('[data-count-up]')) {
    observer.observe(element)
  }
  signal.addEventListener('abort', () => observer.disconnect())
}

document.addEventListener('astro:page-load', setup)
