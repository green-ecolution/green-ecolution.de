// Depth of each measuring point as a share of the water layer in the probe
// illustration (y 120, 200 and 280 on a layer from y 64, 250 units tall).
export const SOAK_POINTS = [0.224, 0.544, 0.864]

// The pinned play starts where a short shower ends, at the first point, so
// there is no fully dry state that would need a text of its own.
const SURFACE_LEVEL = 0.25

// Just past the first point: what a short shower reaches.
export const SHOWER_LEVEL = 0.3

export type SoakOption = 'shower' | 'soak'

export function soakLevel(progress: number): number {
  return SURFACE_LEVEL + Math.min(1, Math.max(0, progress)) * (1 - SURFACE_LEVEL)
}

export function progressForLevel(level: number): number {
  return (level - SURFACE_LEVEL) / (1 - SURFACE_LEVEL)
}

export function reachedPoints(level: number): number {
  return SOAK_POINTS.filter((point) => level >= point).length
}

export function soakOption(level: number): SoakOption {
  return reachedPoints(level) === SOAK_POINTS.length ? 'soak' : 'shower'
}
