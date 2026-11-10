import {
  SHOWER_LEVEL,
  hardwareChapter,
  progressForLevel,
  progressForSoak,
  reachedPoints,
  soakLevel,
  soakOption,
  type SoakOption,
} from '../lib/soakLevel'
import { bindPinnedStage } from './pinStage'

// The chapter markers below the stage and their top margin, once pinned.
const PROGRESS_PX = 28

let page: AbortController | null = null

function setup() {
  page?.abort()
  page = new AbortController()
  const { signal } = page

  for (const root of document.querySelectorAll<HTMLElement>('[data-soak-root]')) {
    const options = [...root.querySelectorAll<HTMLButtonElement>('[data-soak-option]')]
    const points = [...root.querySelectorAll<SVGElement>('.soak-point')]
    const text = root.querySelector<HTMLElement>('[data-soak-text]')
    const statusFor = (option: SoakOption) =>
      options.find((button) => button.dataset.soakOption === option)?.dataset.soakStatus ?? ''

    const show = (pressed: SoakOption | null, status: string) => {
      for (const option of options) {
        option.setAttribute('aria-pressed', String(option.dataset.soakOption === pressed))
      }
      if (text && text.textContent !== status) text.textContent = status
    }

    const stage = root.closest<HTMLElement>('[data-pin-stage]')
    const track = stage?.parentElement
    if (!stage || !track) continue

    const chapters = [...stage.querySelectorAll<HTMLElement>('[data-chapter]')]
    const markers = [...stage.querySelectorAll<HTMLElement>('[data-chapter-marker]')]

    // Hidden chapters stay out of the tab order and the reading order while
    // pinned; unpinned, all of them are on the page one after another.
    const showChapter = (active: number | null) => {
      chapters.forEach((chapter, index) => {
        chapter.dataset.active = String(active === null || index === active)
        chapter.inert = active !== null && index !== active
      })
      markers.forEach((marker, index) => {
        marker.dataset.active = String(index === active)
      })
    }

    const leaveScrollDriven = () => {
      if (!root.hasAttribute('data-scroll-driven')) return
      root.removeAttribute('data-scroll-driven')
      root.dataset.soak = 'shower'
      show('shower', statusFor('shower'))
    }

    const pin = bindPinnedStage(
      track,
      stage,
      signal,
      (progress) => {
        if (progress === null) {
          showChapter(null)
          leaveScrollDriven()
          return
        }

        const { chapter, soakProgress } = hardwareChapter(progress)
        showChapter(chapter)

        const level = soakLevel(soakProgress)
        const reached = reachedPoints(level)
        root.toggleAttribute('data-scroll-driven', true)
        delete root.dataset.soak
        root.style.setProperty('--soak-level', level.toFixed(3))
        points.forEach((point, index) => point.toggleAttribute('data-reached', index < reached))

        if (reached === 2) show(null, root.dataset.soakMidwayStatus ?? '')
        else show(soakOption(level), statusFor(soakOption(level)))
      },
      () => Math.max(...chapters.map((chapter) => chapter.offsetHeight)) + PROGRESS_PX,
    )

    for (const option of options) {
      option.addEventListener(
        'click',
        () => {
          const choice = option.dataset.soakOption as SoakOption
          if (pin.isPinned()) {
            pin.scrollToProgress(
              progressForSoak(choice === 'soak' ? 1 : progressForLevel(SHOWER_LEVEL)),
            )
            return
          }
          root.dataset.soak = choice
          show(choice, statusFor(choice))
        },
        { signal },
      )
    }
  }
}

document.addEventListener('astro:page-load', setup)
