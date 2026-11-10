import {
  SHOWER_LEVEL,
  progressForLevel,
  reachedPoints,
  soakLevel,
  soakOption,
  type SoakOption,
} from '../lib/soakLevel'
import { bindPinnedStage } from './pinStage'

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
    const pin =
      stage && track
        ? bindPinnedStage(track, stage, signal, (progress) => {
            if (progress === null) {
              if (root.hasAttribute('data-scroll-driven')) {
                root.removeAttribute('data-scroll-driven')
                root.dataset.soak = 'shower'
                show('shower', statusFor('shower'))
              }
              return
            }

            const level = soakLevel(progress)
            const reached = reachedPoints(level)
            root.toggleAttribute('data-scroll-driven', true)
            delete root.dataset.soak
            root.style.setProperty('--soak-level', level.toFixed(3))
            points.forEach((point, index) => point.toggleAttribute('data-reached', index < reached))

            if (reached === 2) show(null, root.dataset.soakMidwayStatus ?? '')
            else show(soakOption(level), statusFor(soakOption(level)))
          })
        : null

    for (const option of options) {
      option.addEventListener(
        'click',
        () => {
          const choice = option.dataset.soakOption as SoakOption
          if (pin?.isPinned()) {
            pin.scrollToProgress(choice === 'soak' ? 1 : progressForLevel(SHOWER_LEVEL))
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
