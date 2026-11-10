export interface PinnedStep {
  index: number
  /** How far the reader is through this step, from 0 to 1. */
  fill: number
}

export function pinProgress(scrolled: number, distance: number): number {
  if (distance <= 0) return 1
  return Math.min(1, Math.max(0, scrolled / distance))
}

export function pinnedStep(progress: number, steps: number): PinnedStep {
  const position = Math.min(1, Math.max(0, progress)) * steps
  if (position >= steps) return { index: steps - 1, fill: 1 }

  const index = Math.floor(position)
  return { index, fill: position - index }
}

export function progressForStep(index: number, steps: number): number {
  return (index + 0.5) / steps
}

export function phaseOfStep(fill: number, phases: number): number {
  return Math.min(phases - 1, Math.floor(Math.max(0, fill) * phases))
}
