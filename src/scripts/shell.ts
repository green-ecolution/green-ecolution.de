import { bindScrollFrame } from './scrollFrame'

const LANGUAGE_STORAGE_KEY = 'green_ecolution_language'
const BACK_TO_TOP_THRESHOLD_PX = 500
const HEADER_SCROLLED_PX = 50

let page: AbortController | null = null

export function setup() {
  // The ClientRouter swaps the document but keeps window. Without this every
  // navigation would leave the previous page's scroll handler running.
  page?.abort()
  page = new AbortController()
  const { signal } = page

  const progress = document.getElementById('scroll-progress')
  const header = document.getElementById('site-header')
  const backToTop = document.getElementById('back-to-top')
  const themeColor = document.querySelector('meta[name="theme-color"]')

  let scrollTop = window.scrollY
  let scrollable = 0
  let lastScrollTop = scrollTop
  // What the page shows right now, so a scrolled frame only writes a change.
  let isScrolled: boolean | null = null
  let isBackToTopHidden: boolean | null = null

  const read = () => {
    scrollTop = window.scrollY
    scrollable = document.documentElement.scrollHeight - window.innerHeight
  }

  const write = () => {
    if (progress) {
      progress.style.transform = `scaleX(${scrollable > 0 ? scrollTop / scrollable : 0})`
    }

    const scrolled = scrollTop > HEADER_SCROLLED_PX
    if (header && scrolled !== isScrolled) {
      isScrolled = scrolled
      // Marks the bar as a translucent layer. Its background, its shadow and
      // the blur layer behind it key off the attribute in Header.astro, and
      // general.css turns it solid for readers who asked for less transparency.
      header.toggleAttribute('data-material', scrolled)
      // Chrome and iOS before 26 tint their bars from this; Safari 26 samples the header instead.
      themeColor?.setAttribute('content', scrolled ? '#fcfcfc' : '#4C7741')
    }

    const scrollingDown = scrollTop > lastScrollTop
    lastScrollTop = scrollTop

    // Hidden while reading downwards so it never sits on top of the text.
    const hidden = scrollTop <= BACK_TO_TOP_THRESHOLD_PX || scrollingDown
    if (backToTop && hidden !== isBackToTopHidden) {
      isBackToTopHidden = hidden
      backToTop.classList.toggle('opacity-0', hidden)
      backToTop.classList.toggle('translate-y-4', hidden)
      backToTop.classList.toggle('pointer-events-none', hidden)
    }
  }

  bindScrollFrame({ read, write }, signal)
  read()
  write()

  backToTop?.addEventListener(
    'click',
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
    },
    { signal },
  )

  // The redirect on / reads this key, so a click on the switcher has to record
  // the choice; otherwise a returning visitor silently loses their language.
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-lang-switch]')) {
    link.addEventListener(
      'click',
      () => {
        try {
          window.localStorage.setItem(LANGUAGE_STORAGE_KEY, link.dataset.langSwitch ?? '')
        } catch {
          // Private mode can refuse writes; navigation still happens.
        }
      },
      { signal },
    )
  }
}

// Fires on the first load and after every ClientRouter navigation.
document.addEventListener('astro:page-load', setup)
