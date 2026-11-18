import type { CardCover } from './closeView'

/**
 * Where the close-ups' card covers the stage: bottom left from lg on, nowhere
 * below, where it stands in the strip under the stage.
 */
export function cardCover(canvas: HTMLCanvasElement): CardCover | null {
  const card = canvas.closest('[data-day-stage]')?.querySelector('[data-day-card]')
  if (!card || card.getClientRects().length === 0) return null
  const stage = canvas.getBoundingClientRect()
  const box = card.getBoundingClientRect()
  return {
    right: (box.right - stage.left) / stage.width,
    top: (stage.bottom - box.top) / stage.height,
  }
}

/** The share of the stage's height the status bar covers from the top. */
export function barCover(canvas: HTMLCanvasElement): number {
  const bar = canvas.closest('[data-day-stage]')?.querySelector('[data-day-hud]')
  if (!bar) return 0
  const stage = canvas.getBoundingClientRect()
  return (bar.getBoundingClientRect().bottom - stage.top) / stage.height
}
