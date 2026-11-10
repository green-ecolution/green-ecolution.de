let page: AbortController | null = null

function activate(root: HTMLElement, active: number) {
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

  for (const root of document.querySelectorAll<HTMLElement>('[data-workflow]')) {
    root.dataset.enhanced = ''

    for (const trigger of root.querySelectorAll<HTMLElement>('[data-step-trigger]')) {
      trigger.addEventListener('click', () => activate(root, Number(trigger.dataset.stepTrigger)), {
        signal,
      })
    }
  }
}

document.addEventListener('astro:page-load', setup)
