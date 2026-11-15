import { activeIndex } from '../lib/scrollProgress'
import { bindScrollFrame } from './scrollFrame'

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

    let index = ''
    let offset = ''
    let shown = ''

    const read = () => {
      const tops = parts.map((part) => part.getBoundingClientRect().top)
      const active = activeIndex(tops, window.innerHeight * READING_LINE)
      index = parts[active].dataset.yearIndex ?? '0'
      offset = `${Math.round(tops[active] - tops[0])}px`
    }

    const write = () => {
      if (`${index} ${offset}` === shown) return
      shown = `${index} ${offset}`
      root.style.setProperty('--year-index', index)
      root.style.setProperty('--year-y', offset)
    }

    bindScrollFrame({ read, write }, signal)
    read()
    write()
    root.dataset.enhanced = ''
  }
}

document.addEventListener('astro:page-load', setup)
