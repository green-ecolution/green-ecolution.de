import {
  offsetForProgress,
  progressFromSteps,
  SCROLL_WEIGHTS,
  scrollForStory,
  storyFromScroll,
  type StepBox,
} from '../lib/storyScroll'
import {
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
// The padding the narrow scrub layout puts around the picture.
const FRAME_PADDING_REM = 1.5
// Room the text needs below the standing picture on a narrow screen: the
// finale's chips, selected sentence and contact button.
const NARROW_ROOM_PX = 300

type Mode = 'scrub' | 'autoplay'
type Play = 'idle' | 'playing' | 'done'

let page: AbortController | null = null

const remPx = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

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

    // Development only: holds the story still and shows nothing but the
    // stage, for scripts/render-story-stills.mjs and for checking a moment.
    // `storyStill` picks the still of an act, `storyAt` any progress.
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search)
      const still = params.get('storyStill')
      const at = params.get('storyAt')
      if (still !== null || at !== null) {
        if (still !== null) {
          scene.dataset.act = still
          scene.dataset.storyStill = still
        } else {
          const progress = Number(at)
          scene.style.setProperty('--story', progress.toFixed(4))
          scene.dataset.act = String(storyState(progress).act)
        }
        document.documentElement.dataset.storyCapture = params.has('storyLabels') ? 'labels' : ''
        continue
      }
    }

    const steps = [...root.querySelectorAll<HTMLElement>('[data-step]')]
    const bodies = steps.map((step) => step.querySelector<HTMLElement>('[data-step-body]') ?? step)
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

    // Scrubbing on a narrow screen every panel stays open.
    const syncExpanded = () => {
      const allOpen = mode === 'scrub' && !wide.matches
      triggers.forEach((trigger, index) =>
        trigger.setAttribute('aria-expanded', String(allOpen || index === shownAct)),
      )
    }

    const showAct = (act: number) => {
      if (act === shownAct) return
      shownAct = act
      scene.dataset.act = String(act)
      steps.forEach((step, index) => {
        step.dataset.active = String(index === act)
      })
      syncExpanded()
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
      root.toggleAttribute('data-story-example', state.activeExample !== null)
      showAct(state.act)
      if (state.activeExample !== null) showExample(state.activeExample)
    }

    // Never more than one pending frame: every state other than playing cancels it.
    let frameId = 0

    const setPlay = (next: Play) => {
      if (next !== 'playing') window.cancelAnimationFrame(frameId)
      play = next
      root.dataset.storyPlay = next
    }

    const playOnce = () => {
      if (play !== 'idle' || reduced.matches) return
      setPlay('playing')
      const start = performance.now()

      const tick = (now: number) => {
        const progress = autoStoryProgress(now - start)
        render(progress)
        if (progress < 1) frameId = window.requestAnimationFrame(tick)
        else setPlay('done')
      }
      frameId = window.requestAnimationFrame(tick)
    }

    const setMode = (next: Mode) => {
      if (mode === next) return
      mode = next
      root.dataset.storyMode = next
      syncExpanded()
      setPlay('idle')
      if (next === 'autoplay') {
        render(0)
        if (onScreen) playOnce()
      }
    }

    // Decided once per width. The scrub layout pads the frame, and a mobile
    // toolbar collapsing while scrolling changes the window's height; reacting
    // to either would flip the mode back and forth.
    let narrowScrub = false
    let decidedWidth = 0
    const decideNarrow = () => {
      decidedWidth = window.innerWidth
      const rem = remPx()
      const framed = scene.offsetHeight + FRAME_PADDING_REM * rem
      narrowScrub =
        !wide.matches && window.innerHeight - HEADER_REM * rem - framed >= NARROW_ROOM_PX
    }
    decideNarrow()
    window.addEventListener(
      'resize',
      () => {
        if (window.innerWidth !== decidedWidth) decideNarrow()
      },
      { signal },
    )
    wide.addEventListener('change', syncExpanded, { signal })

    // Where the picture's lower edge stands once it is stuck under the header,
    // which is also where each step's text sticks while its act plays.
    const stuckLine = () => HEADER_REM * remPx() + frame.offsetHeight

    const sizes = new ResizeObserver(() => {
      root.style.setProperty('--story-frame-height', `${frame.offsetHeight}px`)
      for (const body of bodies)
        body.style.setProperty('--step-body-height', `${body.offsetHeight}px`)
    })
    for (const element of [frame, ...bodies]) sizes.observe(element)

    // A step's act plays while its text stands stuck: from the step's top
    // reaching the text's sticky top until its bottom starts pushing the text
    // away. That stretch is the step's spacer, sized by its weight. A text
    // sticking above the line is shifted onto it, so one line serves all.
    const stepBoxes = (): StepBox[] => {
      const line = stuckLine()
      return steps.map((step, index) => {
        const body = bodies[index]
        const stuckAt = Number.parseFloat(getComputedStyle(body).top)
        return {
          top:
            step.getBoundingClientRect().top + line - (Number.isFinite(stuckAt) ? stuckAt : line),
          height: step.offsetHeight - body.offsetHeight,
        }
      })
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
          render(storyFromScroll(progress))
        } else if (narrowScrub) {
          setMode('scrub')
          render(storyFromScroll(progressFromSteps(stuckLine(), stepBoxes(), SCROLL_WEIGHTS)))
        } else {
          setMode('autoplay')
        }
      },
      tallestStage,
    )

    const jumpTo = (progress: number) => {
      if (pin.isPinned()) {
        pin.scrollToProgress(scrollForStory(progress))
        return
      }
      if (mode === 'scrub') {
        const scroll = scrollForStory(progress)
        window.scrollBy({
          top: offsetForProgress(scroll, stepBoxes(), SCROLL_WEIGHTS) - stuckLine(),
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
    signal.addEventListener('abort', () => {
      viewport.disconnect()
      sizes.disconnect()
      window.cancelAnimationFrame(frameId)
    })
  }
}

document.addEventListener('astro:page-load', setup)
