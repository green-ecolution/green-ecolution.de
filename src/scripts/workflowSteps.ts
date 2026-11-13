import { phaseOfStep, pinnedStep, progressForStep } from '../lib/pinnedSteps'
import { bindPinnedStage } from './pinStage'

let page: AbortController | null = null

function phasesOf(root: HTMLElement, step: number): number {
  return root.querySelectorAll(`[data-step-visual="${step}"]`).length || 1
}

function activate(root: HTMLElement, active: number, phase = 0) {
  const key = `${active}:${phase}`
  if (root.dataset.activeVisual === key) return
  root.dataset.activeVisual = key
  root.dataset.activeStep = String(active)

  for (const step of root.querySelectorAll<HTMLElement>('[data-step]')) {
    step.dataset.active = String(Number(step.dataset.step) === active)
  }
  for (const trigger of root.querySelectorAll<HTMLElement>('[data-step-trigger]')) {
    trigger.setAttribute('aria-expanded', String(Number(trigger.dataset.stepTrigger) === active))
  }
  for (const visual of root.querySelectorAll<HTMLElement>('[data-step-visual]')) {
    const isActive =
      Number(visual.dataset.stepVisual) === active &&
      Number(visual.dataset.stepPhase ?? 0) === phase
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
    const stage = root.closest<HTMLElement>('[data-pin-stage]')
    const track = stage?.parentElement
    if (!stage || !track) continue

    const steps = root.querySelectorAll('[data-step]').length
    const weights = Array.from({ length: steps }, (_, step) => phasesOf(root, step))
    root.dataset.enhanced = ''
    root.dataset.activeStep = '0'
    root.dataset.activeVisual = '0:0'

    const pin = bindPinnedStage(track, stage, signal, (progress) => {
      if (progress === null) {
        root.style.removeProperty('--step-fill')
        return
      }
      const { index, fill } = pinnedStep(progress, weights)
      root.style.setProperty('--step-fill', fill.toFixed(3))
      activate(root, index, phaseOfStep(fill, weights[index]))
    })

    // Links elsewhere on the page that name a step, such as the hero tagline.
    for (const jump of document.querySelectorAll<HTMLElement>('[data-workflow-jump]')) {
      jump.addEventListener(
        'click',
        (event) => {
          const index = Number(jump.dataset.workflowJump)
          if (pin.isPinned()) {
            // The link's own target is the section top, which is step one.
            event.preventDefault()
            pin.scrollToProgress(progressForStep(index, weights))
          } else {
            activate(root, index)
          }
        },
        { signal },
      )
    }

    for (const trigger of root.querySelectorAll<HTMLElement>('[data-step-trigger]')) {
      trigger.addEventListener(
        'click',
        () => {
          const index = Number(trigger.dataset.stepTrigger)
          // While pinned the scroll position owns the state, so a click moves
          // the page there instead of fighting the next scroll event.
          if (pin.isPinned()) pin.scrollToProgress(progressForStep(index, weights))
          else activate(root, index)
        },
        { signal },
      )
    }
  }
}

document.addEventListener('astro:page-load', setup)
