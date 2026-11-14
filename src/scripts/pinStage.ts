import { pinProgress } from '../lib/pinnedSteps'
import { bindScrollFrame } from './scrollFrame'

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
  // Stages whose parts overlap once pinned report their pinned height here;
  // by default it is the height of the stage content as laid out.
  contentHeight?: () => number,
  // Layout reads `onUpdate` needs besides the progress. They belong here
  // because `onUpdate` runs among the writes of the frame, where a read would
  // force a layout pass.
  onMeasure?: (pinned: boolean) => void,
): PinnedStage {
  const wide = window.matchMedia(WIDE_ENOUGH)
  let pinned = false
  let measured = { scrolled: 0, distance: 0 }

  const decidePinning = () => {
    const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const available = window.innerHeight - HEADER_REM * rem - STAGE_MARGIN_PX
    const content =
      contentHeight?.() ??
      [...stage.children].reduce(
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

  const read = () => {
    if (pinned) measured = measure()
    onMeasure?.(pinned)
  }

  const write = () => {
    onUpdate(pinned ? pinProgress(measured.scrolled, measured.distance) : null)
  }

  const update = () => {
    read()
    write()
  }

  // The resize also reaches the frame below, which then reads the new pinning.
  bindScrollFrame({ read, write }, signal)
  window.addEventListener('resize', decidePinning, { signal })

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
