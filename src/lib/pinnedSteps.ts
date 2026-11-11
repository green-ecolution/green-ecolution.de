export interface PinnedStep {
  index: number
  /** How far the reader is through this step, from 0 to 1. */
  fill: number
}

export function pinProgress(scrolled: number, distance: number): number {
  if (distance <= 0) return 1
  return Math.min(1, Math.max(0, scrolled / distance))
}

// Each step claims a share of the scroll distance proportional to its weight.
export function pinnedStep(progress: number, weights: number[]): PinnedStep {
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let position = Math.min(1, Math.max(0, progress)) * total
  if (position >= total) return { index: weights.length - 1, fill: 1 }

  for (const [index, weight] of weights.entries()) {
    if (position < weight) return { index, fill: position / weight }
    position -= weight
  }
  return { index: weights.length - 1, fill: 1 }
}

// Lands in the middle of the step's first unit, so a step with several
// visuals opens on its first one.
export function progressForStep(index: number, weights: number[]): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  const start = weights.slice(0, index).reduce((sum, weight) => sum + weight, 0)
  return (start + Math.min(0.5, weights[index] / 2)) / total
}

export function phaseOfStep(fill: number, phases: number): number {
  return Math.min(phases - 1, Math.floor(Math.max(0, fill) * phases))
}
