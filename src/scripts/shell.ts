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

  let frame = 0

  const update = () => {
    frame = 0
    const scrollTop = window.scrollY

    if (progress) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const percent = docHeight > 0 ? scrollTop / docHeight : 0
      progress.style.transform = `scaleX(${percent})`
    }

    if (header) {
      const scrolled = scrollTop > HEADER_SCROLLED_PX
      header.classList.toggle('bg-white/80', scrolled)
      header.classList.toggle('backdrop-blur-xl', scrolled)
      header.classList.toggle('backdrop-saturate-150', scrolled)
      header.classList.toggle('shadow-header-edge', scrolled)
      header.classList.toggle('bg-transparent', !scrolled)
      // Marks the bar as a translucent layer; general.css turns it solid again
      // for readers who asked for less transparency.
      header.toggleAttribute('data-material', scrolled)

      // The iOS status bar picks up this colour, so it has to follow the header.
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', scrolled ? '#fcfcfc' : '#4C7741')
    }

    if (backToTop) {
      const hidden = scrollTop <= BACK_TO_TOP_THRESHOLD_PX
      backToTop.classList.toggle('opacity-0', hidden)
      backToTop.classList.toggle('translate-y-4', hidden)
      backToTop.classList.toggle('pointer-events-none', hidden)
    }
  }

  const onScroll = () => {
    if (frame === 0) frame = window.requestAnimationFrame(update)
  }

  window.addEventListener('scroll', onScroll, { passive: true, signal })
  signal.addEventListener('abort', () => {
    if (frame !== 0) window.cancelAnimationFrame(frame)
  })
  update()

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
