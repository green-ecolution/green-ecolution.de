import { offsetForProgress, progressFromSteps, type StepBox } from '../lib/storyScroll'
import {
  ACT_WEIGHTS,
  autoStoryProgress,
  progressForAct,
  progressForExample,
  storyState,
} from '../lib/storyTimeline'
import { bindPinnedStage } from './pinStage'

// Must match the media queries of the narrow layout in HowItWorks.astro.
const WIDE_ENOUGH = '(min-width: 768px)'
// The fixed site header the picture sticks below.
const HEADER_REM = 4.5
// Room the text needs below the standing picture on a narrow screen.
const NARROW_ROOM_PX = 220
// How far below the picture the line sits that decides which step is read.
const READING_LINE = 0.35

type Mode = 'scrub' | 'autoplay'
type Play = 'idle' | 'playing' | 'done'

let page: AbortController | null = null

function setup() {
  page?.abort()
  page = new AbortController()
  const { signal } = page

  for (const root of document.querySelectorAll<HTMLElement>('[data-story]')) {
    const stage = root.closest<HTMLElement>('[data-pin-stage]')
    const track = stage?.parentElement
    const scene = root.querySelector<HTMLElement>('[data-story-root]')
    const frame = root.querySelector<HTMLElement>('[data-story-frame]')
    const list = root.querySelector<HTMLElement>('[data-story-steps]')
    if (!stage || !track || !scene || !frame || !list) continue

    const steps = [...root.querySelectorAll<HTMLElement>('[data-step]')]
    const triggers = [...root.querySelectorAll<HTMLElement>('[data-step-trigger]')]
    const chips = [...root.querySelectorAll<HTMLElement>('[data-example-trigger]')]
    const texts = [...root.querySelectorAll<HTMLElement>('[data-example-text]')]
    const captions = [...root.querySelectorAll<HTMLElement>('[data-example-caption]')]
    const wide = window.matchMedia(WIDE_ENOUGH)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    let mode: Mode | null = null
    let play: Play = 'idle'
    let shownAct = -1
    let shownExample = -1
    let onScreen = false

    const showExample = (index: number) => {
      if (index === shownExample) return
      shownExample = index
      chips.forEach((chip, position) =>
        chip.setAttribute('aria-pressed', String(position === index)),
      )
      for (const group of [texts, captions]) {
        group.forEach((element, position) => {
          element.hidden = position !== index
        })
      }
    }

    const showAct = (act: number) => {
      if (act === shownAct) return
      shownAct = act
      scene.dataset.act = String(act)
      steps.forEach((step, index) => {
        step.dataset.active = String(index === act)
      })
      triggers.forEach((trigger, index) =>
        trigger.setAttribute('aria-expanded', String(index === act)),
      )
    }

    const render = (progress: number) => {
      const state = storyState(progress)
      scene.style.setProperty('--story', progress.toFixed(4))
      // With reduced motion the scene shows the still of the act instead of
      // travelling there.
      if (reduced.matches) scene.dataset.storyStill = String(state.act)
      else delete scene.dataset.storyStill
      root.style.setProperty('--step-fill', state.actProgress.toFixed(3))
      root.toggleAttribute('data-invite', state.invite >= 0.5)
      showAct(state.act)
      if (state.activeExample !== null) showExample(state.activeExample)
    }

    const setPlay = (next: Play) => {
      play = next
      root.dataset.storyPlay = next
    }

    const playOnce = () => {
      if (play !== 'idle' || reduced.matches) return
      setPlay('playing')
      const start = performance.now()

      const tick = (now: number) => {
        if (signal.aborted || mode !== 'autoplay' || play !== 'playing') return
        const progress = autoStoryProgress(now - start)
        render(progress)
        if (progress < 1) window.requestAnimationFrame(tick)
        else setPlay('done')
      }
      window.requestAnimationFrame(tick)
    }

    const setMode = (next: Mode) => {
      if (mode === next) return
      mode = next
      root.dataset.storyMode = next
      if (next === 'autoplay') {
        setPlay('idle')
        render(0)
        if (onScreen) playOnce()
      }
    }

    const narrowFits = () => {
      if (wide.matches) return false
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      return window.innerHeight - HEADER_REM * rem - frame.offsetHeight >= NARROW_ROOM_PX
    }

    const stepBoxes = (): StepBox[] =>
      steps.map((step) => {
        const { top, height } = step.getBoundingClientRect()
        return { top, height }
      })

    const readingLine = () => {
      const { bottom } = frame.getBoundingClientRect()
      return bottom + (window.innerHeight - bottom) * READING_LINE
    }

    // The finale has the tallest panel. Measuring with it open keeps the stage
    // from growing out of the window once the story gets there. The panels may
    // still be mid-transition, so only their current height is taken out.
    const tallestStage = () => {
      const shown = list.querySelectorAll<HTMLElement>('.story-panel')
      const shownHeight = [...shown].reduce((sum, panel) => sum + panel.offsetHeight, 0)
      const tallestPanel = Math.max(
        ...[...shown].map((panel) => panel.firstElementChild?.scrollHeight ?? 0),
      )
      const tallestList = list.offsetHeight - shownHeight + tallestPanel
      return Math.max(frame.offsetHeight, tallestList)
    }

    showExample(0)
    root.dataset.enhanced = ''

    const pin = bindPinnedStage(
      track,
      stage,
      signal,
      (progress) => {
        if (progress !== null) {
          setMode('scrub')
          render(progress)
        } else if (narrowFits()) {
          setMode('scrub')
          render(progressFromSteps(readingLine(), stepBoxes(), ACT_WEIGHTS))
        } else {
          setMode('autoplay')
        }
      },
      tallestStage,
    )

    const jumpTo = (progress: number) => {
      if (pin.isPinned()) {
        pin.scrollToProgress(progress)
        return
      }
      if (mode === 'scrub') {
        window.scrollBy({
          top: offsetForProgress(progress, stepBoxes(), ACT_WEIGHTS) - readingLine(),
          behavior: reduced.matches ? 'auto' : 'smooth',
        })
        return
      }
      setPlay('done')
      render(progress)
    }

    triggers.forEach((trigger, index) =>
      trigger.addEventListener('click', () => jumpTo(progressForAct(index)), { signal }),
    )

    chips.forEach((chip, index) =>
      chip.addEventListener(
        'click',
        () => {
          showExample(index)
          jumpTo(progressForExample(index))
        },
        { signal },
      ),
    )

    // Links elsewhere on the page that name a step, such as the hero tagline.
    for (const jump of document.querySelectorAll<HTMLElement>('[data-workflow-jump]')) {
      jump.addEventListener(
        'click',
        (event) => {
          // Scrubbing, the scroll position owns the state. Otherwise the
          // link's own jump to the section is all the scrolling it takes.
          if (mode === 'scrub') event.preventDefault()
          jumpTo(progressForAct(Number(jump.dataset.workflowJump)))
        },
        { signal },
      )
    }

    root.querySelector<HTMLElement>('[data-story-replay]')?.addEventListener(
      'click',
      () => {
        if (mode !== 'autoplay' || play === 'playing') return
        setPlay('idle')
        render(0)
        playOnce()
      },
      { signal },
    )

    const viewport = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting)
        if (onScreen && mode === 'autoplay') playOnce()
      },
      { threshold: 0.5 },
    )
    viewport.observe(scene)
    signal.addEventListener('abort', () => viewport.disconnect())
  }
}

document.addEventListener('astro:page-load', setup)
