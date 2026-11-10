import { activeStepIndex } from '../lib/scrollSteps'

let page: AbortController | null = null

function setup() {
  page?.abort()
  page = new AbortController()
  const { signal } = page

  for (const root of document.querySelectorAll<HTMLElement>('[data-scroll-steps]')) {
    const steps = [...root.querySelectorAll<HTMLElement>('[data-step]')]
    const visuals = [...root.querySelectorAll<HTMLElement>('[data-step-visual]')]
    let frame = 0
    let current = -1

    const update = () => {
      frame = 0
      const active = activeStepIndex(
        steps.map((step) => step.getBoundingClientRect().top),
        window.innerHeight,
      )
      if (active === current) return
      current = active
      for (const element of [...steps, ...visuals]) {
        const index = Number(element.dataset.step ?? element.dataset.stepVisual)
        element.dataset.active = String(index === active)
      }
    }

    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update)
    }

    window.addEventListener('scroll', schedule, { passive: true, signal })
    window.addEventListener('resize', schedule, { signal })
    signal.addEventListener('abort', () => {
      if (frame !== 0) window.cancelAnimationFrame(frame)
    })
    update()
  }
}

document.addEventListener('astro:page-load', setup)
