import { scrollProgress } from '../lib/scrollProgress'
import { bindScrollFrame } from './scrollFrame'

// The lower edge of the disc follows one line in the window, a little above
// its lower edge: the rings grow as the disc scrolls in and are full-grown
// once its end has passed that line.
const GROWN_LINE = 0.85
const RANGE = { start: GROWN_LINE, end: GROWN_LINE }

let page: AbortController | null = null

// Without this script, and under reduced motion, the disc stands full-grown.
function setup() {
  page?.abort()
  page = new AbortController()
  const { signal } = page

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  for (const stage of document.querySelectorAll<HTMLElement>('[data-roadmap-rings]')) {
    // On a phone the entries stand below the disc; they must not stretch the growth.
    const disc = stage.querySelector<HTMLElement>('[data-roadmap-disc]') ?? stage
    let grown = 0
    let shown = ''

    const read = () => {
      const { top, height } = disc.getBoundingClientRect()
      // It never shrinks back: what has grown stays.
      grown = Math.max(grown, scrollProgress(top, height, window.innerHeight, RANGE))
    }

    const write = () => {
      const value = grown.toFixed(3)
      if (value === shown) return
      shown = value
      stage.style.setProperty('--grow', value)
    }

    bindScrollFrame({ read, write }, signal)
    read()
    write()
  }
}

document.addEventListener('astro:page-load', setup)
