import { useCallback, useEffect, useRef, useState } from 'react'
import { seekScene } from './clock'
import type { TimelineEntry } from './timeline'

export interface Playback {
  /**
   * Stand on the first frame until `window.__showcaseStart()` is called. The
   * screen recorder needs the picture up and the videos buffered before the
   * run begins, and a first frame that waits costs nothing at the cut.
   */
  holdUntilStart?: boolean
  /** Hold the last frame instead of wrapping around to the first. */
  stopAtEnd?: boolean
}

// Frame deltas rather than `now - started`: a clock that can be paused or moved
// has no fixed origin to subtract from, and resuming against the old one would
// hand the loop every millisecond it stood still.
export function useShowcaseClock(timeline: TimelineEntry[], playback: Playback = {}): number {
  const { holdUntilStart = false, stopAtEnd = false } = playback
  const totalMs = timeline[timeline.length - 1].endMs
  const [elapsedMs, setElapsedMs] = useState(0)
  const [paused, setPaused] = useState(false)
  const [started, setStarted] = useState(!holdUntilStart)
  const elapsed = useRef(0)

  useEffect(() => {
    if (!holdUntilStart) {
      return
    }

    window.__showcaseStart = () => setStarted(true)
    return () => {
      delete window.__showcaseStart
    }
  }, [holdUntilStart])

  // Holding the clock is not enough: every build animation runs on the
  // browser's own timeline from the moment its scene mounts, so the class
  // freezes them at their first frame until the run is released.
  useEffect(() => {
    if (!holdUntilStart) {
      return
    }

    document.documentElement.classList.toggle('showcase-held', !started)
    return () => document.documentElement.classList.remove('showcase-held')
  }, [holdUntilStart, started])

  useEffect(() => {
    if (paused || !started) {
      return
    }

    let previous = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      elapsed.current += now - previous
      previous = now

      // A run that ends rather than loops stops one millisecond short of the
      // boundary, which is the last frame of the closing scene. The recording
      // is cut out of a longer take, so an end that stands forgives a late cut
      // the same way the held first frame forgives an early one.
      if (stopAtEnd && elapsed.current >= totalMs) {
        elapsed.current = totalMs - 1
        setElapsedMs(elapsed.current)
        return
      }

      setElapsedMs(elapsed.current)
      frame = requestAnimationFrame(tick)
    })

    return () => cancelAnimationFrame(frame)
  }, [paused, started, stopAtEnd, totalMs])

  const seek = useCallback(
    (offset: -1 | 0 | 1) => {
      elapsed.current = seekScene(timeline, elapsed.current, offset)
      setElapsedMs(elapsed.current)
    },
    [timeline],
  )

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      switch (event.key) {
        case ' ':
          setPaused((wasPaused) => !wasPaused)
          break
        case 'ArrowRight':
          seek(1)
          break
        case 'ArrowLeft':
          seek(-1)
          break
        case 'r':
        case 'R':
          seek(0)
          break
        default:
          return
      }

      // Space scrolls the page, the arrows scroll it sideways.
      event.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [seek])

  return elapsedMs
}
