import { pinProgress } from '../lib/pinnedSteps'

// Must match the media query for [data-pin-track] in general.css.
const WIDE_ENOUGH = '(min-width: 768px)'
// The fixed site header the stage sticks below.
const HEADER_REM = 4.5
// Breathing room so a pinned stage never touches the header or the fold.
const STAGE_MARGIN_PX = 24

export interface PinnedStage {
  isPinned: () => boolean
  scrollToProgress: (progress: number) => void
}

/**
 * Pins `stage` inside `track` while the reader scrolls through the track's
 * extra height, and reports how far they are as a value from 0 to 1. Reports
 * null whenever the stage is not pinned: on narrow screens, or when it is
 * taller than the window and pinning would hide its top under the header.
 */
export function bindPinnedStage(
  track: HTMLElement,
  stage: HTMLElement,
  signal: AbortSignal,
  onUpdate: (progress: number | null) => void,
): PinnedStage {
  const wide = window.matchMedia(WIDE_ENOUGH)
  let pinned = false
  let frame = 0

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
    track.toggleAttribute('data-pinned', pinned)
  }

  const measure = () => ({
    scrolled: stage.getBoundingClientRect().top - track.getBoundingClientRect().top,
    distance: track.offsetHeight - stage.offsetHeight,
  })

  const update = () => {
    frame = 0
    if (!pinned) {
      onUpdate(null)
      return
    }
    const { scrolled, distance } = measure()
    onUpdate(pinProgress(scrolled, distance))
  }

  const schedule = () => {
    if (frame === 0) frame = window.requestAnimationFrame(update)
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

  // Content that settles after setup, such as steps collapsing, changes the
  // height the first pass measured.
  const settle = window.setTimeout(() => {
    decidePinning()
    update()
  }, 450)
  signal.addEventListener('abort', () => window.clearTimeout(settle))

  return {
    isPinned: () => pinned,
    scrollToProgress: (progress) => {
      const { distance } = measure()
      const trackTop = track.getBoundingClientRect().top + window.scrollY
      const stageTop = Number.parseFloat(getComputedStyle(stage).top) || 0
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({
        top: trackTop - stageTop + progress * distance,
        behavior: reduced ? 'auto' : 'smooth',
      })
    },
  }
}
