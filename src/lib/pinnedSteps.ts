export interface PinnedStep {
  index: number
  /** How far the reader is through this step, from 0 to 1. */
  fill: number
}

export function pinnedStep(scrolled: number, distance: number, steps: number): PinnedStep {
  if (distance <= 0) return { index: 0, fill: 1 }

  const progress = Math.min(1, Math.max(0, scrolled / distance)) * steps
  if (progress >= steps) return { index: steps - 1, fill: 1 }

  const index = Math.floor(progress)
  return { index, fill: progress - index }
}

export function scrollOffsetForStep(index: number, distance: number, steps: number): number {
  return ((index + 0.5) / steps) * distance
}
