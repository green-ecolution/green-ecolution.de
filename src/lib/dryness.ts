export type Thirst = 'dry' | 'soon' | 'ok'

export const MAX_DRY_DAYS = 14

const DRY_BELOW = 0.25
const SOON_BELOW = 0.5

/** How much water a tree has left, 1 right after rain; `rate` is what a dry day takes. */
export function moisture(rate: number, days: number): number {
  return Math.min(1, Math.max(0, 1 - rate * days))
}

export function thirst(level: number): Thirst {
  if (level < DRY_BELOW) return 'dry'
  return level < SOON_BELOW ? 'soon' : 'ok'
}
