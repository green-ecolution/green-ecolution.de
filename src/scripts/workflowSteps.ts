import { pinnedStep, scrollOffsetForStep } from '../lib/pinnedSteps'

// Must match the media query that pins the stage in ProcessCompact.astro.
const WIDE_ENOUGH = '(min-width: 768px)'
// The fixed site header the stage sticks below.
const HEADER_REM = 4.5
// Breathing room so the pinned stage never touches the header or the fold.
const STAGE_MARGIN_PX = 24

let page: AbortController | null = null

function activate(root: HTMLElement, active: number) {
  if (root.dataset.activeStep === String(active)) return
  root.dataset.activeStep = String(active)

  for (const step of root.querySelectorAll<HTMLElement>('[data-step]')) {
    step.dataset.active = String(Number(step.dataset.step) === active)
  }
  for (const trigger of root.querySelectorAll<HTMLElement>('[data-step-trigger]')) {
    trigger.setAttribute('aria-expanded', String(Number(trigger.dataset.stepTrigger) === active))
  }
  for (const visual of root.querySelectorAll<HTMLElement>('[data-step-visual]')) {
    const isActive = Number(visual.dataset.stepVisual) === active
    visual.dataset.active = String(isActive)
    if (isActive) visual.removeAttribute('aria-hidden')
    else visual.setAttribute('aria-hidden', 'true')
  }
}

function setup() {
  page?.abort()
  page = new AbortController()
  const { signal } = page
  const wide = window.matchMedia(WIDE_ENOUGH)

  for (const pin of document.querySelectorAll<HTMLElement>('[data-workflow-pin]')) {
    const root = pin.querySelector<HTMLElement>('[data-workflow]')
    const stage = root?.parentElement
    if (!root || !stage) continue

    const steps = root.querySelectorAll('[data-step]').length
    let pinned = false

    // Pinning a stage taller than the window would hide its top under the
    // header for the whole stretch, so short windows keep the plain switcher.
    const decidePinning = () => {
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const available = window.innerHeight - HEADER_REM * rem - STAGE_MARGIN_PX
      const content = [...stage.children].reduce(
        (sum, child) =>
          sum +
          (child as HTMLElement).offsetHeight +
          Number.parseFloat(getComputedStyle(child).marginBottom),
        0,
      )
      pinned = wide.matches && content <= available
      pin.toggleAttribute('data-pinned', pinned)
    }
    root.dataset.enhanced = ''
    root.dataset.activeStep = '0'

    // How far the reader is into the pinned stretch, and how long that stretch is.
    const measure = () => ({
      scrolled: stage.getBoundingClientRect().top - pin.getBoundingClientRect().top,
      distance: pin.offsetHeight - stage.offsetHeight,
    })

    let frame = 0
    const update = () => {
      frame = 0
      if (!pinned) {
        root.style.removeProperty('--step-fill')
        return
      }
      const { scrolled, distance } = measure()
      const { index, fill } = pinnedStep(scrolled, distance, steps)
      root.style.setProperty('--step-fill', fill.toFixed(3))
      activate(root, index)
    }
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update)
    }

    for (const trigger of root.querySelectorAll<HTMLElement>('[data-step-trigger]')) {
      trigger.addEventListener(
        'click',
        () => {
          const index = Number(trigger.dataset.stepTrigger)
          if (!pinned) {
            activate(root, index)
            return
          }
          // While pinned the scroll position owns the state, so a click moves
          // the page there instead of fighting the next scroll event.
          const { distance } = measure()
          const pinTop = pin.getBoundingClientRect().top + window.scrollY
          const stageTop = Number.parseFloat(getComputedStyle(stage).top) || 0
          const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          window.scrollTo({
            top: pinTop - stageTop + scrollOffsetForStep(index, distance, steps),
            behavior: reduced ? 'auto' : 'smooth',
          })
        },
        { signal },
      )
    }

    window.addEventListener('scroll', schedule, { passive: true, signal })
    window.addEventListener(
      'resize',
      () => {
        decidePinning()
        schedule()
      },
      { signal },
    )
    signal.addEventListener('abort', () => {
      if (frame !== 0) window.cancelAnimationFrame(frame)
    })
    decidePinning()
    update()

    // The steps start collapsing once the script marks the root, so measure
    // again after that settles; the first pass sees them still open.
    const settle = window.setTimeout(() => {
      decidePinning()
      update()
    }, 450)
    signal.addEventListener('abort', () => window.clearTimeout(settle))
  }
}

document.addEventListener('astro:page-load', setup)
