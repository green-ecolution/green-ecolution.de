import {
  AUTO_SOAK_TOTAL_MS,
  autoSoakProgress,
  chapterProgress,
  hardwareChapter,
  progressForChapter,
  reachedPoints,
  revealedCount,
  soakLevel,
} from '../lib/soakLevel'
import { bindPinnedStage } from './pinStage'

// The chapter markers below the stage and their top margin, once pinned.
const PROGRESS_PX = 62

let page: AbortController | null = null

function setup() {
  page?.abort()
  page = new AbortController()
  const { signal } = page

  for (const root of document.querySelectorAll<HTMLElement>('[data-soak-root]')) {
    const stage = root.closest<HTMLElement>('[data-pin-stage]')
    const track = stage?.parentElement
    if (!stage || !track) continue

    const points = [...root.querySelectorAll<SVGElement>('.soak-point')]
    const readings = [...stage.querySelectorAll<HTMLElement>('[data-soak-reading]')]
    const text = root.querySelector<HTMLElement>('[data-soak-text]')
    const statuses = [
      root.dataset.soakStatusShower,
      root.dataset.soakStatusMidway,
      root.dataset.soakStatusSoak,
    ]

    const waters = [...root.querySelectorAll<SVGElement>('.soak-water')]
    let shownReached = -1

    // The 3d island reads the level from the root's inline style, the sketch
    // from its water. The property does not inherit (see SensorProbe.astro),
    // so the water gets its own copy.
    const render = (level: number) => {
      const value = level.toFixed(3)
      root.style.setProperty('--soak-level', value)
      for (const water of waters) water.style.setProperty('--soak-level', value)

      const reached = reachedPoints(level)
      if (reached === shownReached) return
      shownReached = reached
      for (const marks of [points, readings]) {
        marks.forEach((mark, index) => mark.toggleAttribute('data-reached', index < reached))
      }
      const status = statuses[Math.max(0, reached - 1)] ?? ''
      if (text && text.textContent !== status) text.textContent = status
    }

    const chapters = [...stage.querySelectorAll<HTMLElement>('[data-chapter]')]
    const markers = [...stage.querySelectorAll<HTMLElement>('[data-chapter-marker]')]
    const fills = markers.map((marker) => marker.querySelector<HTMLElement>('.chapter-fill'))
    const parts = chapters.map((chapter) => [
      ...chapter.querySelectorAll<HTMLElement>('[data-reveal-item]'),
    ])
    // What the page shows right now, so a scrolled frame only writes a change.
    let shownChapter: number | null | undefined
    const shownParts = chapters.map(() => -1)

    // Hidden chapters stay out of the tab order and the reading order while
    // pinned; unpinned, all of them are on the page one after another.
    const showChapter = (active: number | null) => {
      if (active === shownChapter) return
      shownChapter = active
      chapters.forEach((chapter, index) => {
        chapter.dataset.active = String(active === null || index === active)
        chapter.inert = active !== null && index !== active
      })
      markers.forEach((marker, index) => {
        marker.dataset.active = String(index === active)
        marker.toggleAttribute('data-passed', active !== null && index < active)
        if (index === active) marker.setAttribute('aria-current', 'step')
        else marker.removeAttribute('aria-current')
      })
    }

    // Unpinned there is no scroll distance to spread the parts over, so they
    // are all there.
    const revealParts = (progress: number | null) => {
      chapters.forEach((chapter, index) => {
        const items = parts[index]
        const shown =
          progress === null
            ? items.length
            : revealedCount(chapterProgress(progress, index), items.length)
        if (shown === shownParts[index]) return
        shownParts[index] = shown
        items.forEach((item, position) => item.toggleAttribute('data-shown', position < shown))
        chapter.dataset.revealed = String(shown)
      })
    }

    let autoplay: 'idle' | 'playing' | 'done' = 'idle'
    // The replay control shows once the play has run through, and reads the
    // state to step back while it runs again.
    const setAutoplay = (state: typeof autoplay) => {
      autoplay = state
      root.dataset.soakPlay = state
      if (state === 'done') root.dataset.soakPlayed = ''
    }
    let pinned: boolean | null = null

    const pin = bindPinnedStage(
      track,
      stage,
      signal,
      (progress) => {
        if (progress === null) {
          if (pinned !== false) {
            pinned = false
            showChapter(null)
            revealParts(null)
            for (const fill of fills) fill?.style.removeProperty('--chapter-fill')
            render(soakLevel(autoplay === 'done' ? 1 : 0))
          }
          return
        }

        pinned = true
        const { chapter, soakProgress } = hardwareChapter(progress)
        showChapter(chapter)
        revealParts(progress)
        // On the one bar that shows it: on the stage it would inherit, and
        // every scrolled frame would restyle the whole section.
        fills[chapter]?.style.setProperty(
          '--chapter-fill',
          chapterProgress(progress, chapter).toFixed(3),
        )
        render(soakLevel(soakProgress))
      },
      () => Math.max(...chapters.map((chapter) => chapter.offsetHeight)) + PROGRESS_PX,
    )

    markers.forEach((marker, index) => {
      marker.addEventListener('click', () => pin.scrollToProgress(progressForChapter(index)), {
        signal,
      })
    })

    const playOnce = () => {
      if (autoplay !== 'idle') return
      setAutoplay('playing')
      const stepped = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const start = performance.now()

      const tick = (now: number) => {
        if (signal.aborted || pin.isPinned()) {
          setAutoplay('idle')
          return
        }
        const elapsed = now - start
        render(soakLevel(autoSoakProgress(elapsed, stepped)))
        if (elapsed < AUTO_SOAK_TOTAL_MS) window.requestAnimationFrame(tick)
        else setAutoplay('done')
      }
      window.requestAnimationFrame(tick)
    }

    // Unpinned the water sinks in only once, so whoever missed it can ask for
    // it again. Pinned, scrolling back does the same and the control is hidden.
    root.querySelector<HTMLElement>('[data-soak-replay]')?.addEventListener(
      'click',
      () => {
        if (pin.isPinned() || autoplay === 'playing') return
        setAutoplay('idle')
        render(soakLevel(0))
        playOnce()
      },
      { signal },
    )

    // While the poster still stands in, the water would sink where nobody can
    // see it, so the play waits for the model or, without webgl, the sketch.
    const canShowWater = () =>
      root.hasAttribute('data-model-ready') || root.dataset.probeView === 'sketch'
    let onScreen = false
    const playWhenSeen = () => {
      if (onScreen && canShowWater() && !pin.isPinned()) playOnce()
    }

    const viewport = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting)
        playWhenSeen()
      },
      { threshold: 0.6 },
    )
    viewport.observe(root)
    // The sketch only shows where webgl is missing. Its SMIL animations
    // restyle the page on every frame even while it is not rendered, so they
    // stand still until it is.
    const sketch = root.querySelector<SVGSVGElement>('svg.probe-sketch')
    const syncSketch = () => {
      if (root.dataset.probeView === 'sketch') sketch?.unpauseAnimations()
      else sketch?.pauseAnimations()
    }
    syncSketch()

    const view = new MutationObserver(() => {
      syncSketch()
      playWhenSeen()
    })
    view.observe(root, {
      attributes: true,
      attributeFilter: ['data-model-ready', 'data-probe-view'],
    })
    signal.addEventListener('abort', () => {
      viewport.disconnect()
      view.disconnect()
    })
  }
}

document.addEventListener('astro:page-load', setup)
