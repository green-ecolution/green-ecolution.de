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

// The water gets the first half of the pinned stretch; installation and setup
// share the rest. Each later chapter starts where the previous one ends.
const CHAPTER_STARTS = [0, 0.5, 0.75]
const SOAK_SHARE = CHAPTER_STARTS[1]

export function hardwareChapter(progress: number): { chapter: number; soakProgress: number } {
  const chapter = CHAPTER_STARTS.filter((start) => progress >= start).length - 1
  return { chapter: Math.max(0, chapter), soakProgress: Math.min(1, progress / SOAK_SHARE) }
}

// Stops just short of the chapter change, so the full soak stays on screen.
export function progressForSoak(soakProgress: number): number {
  return Math.min(soakProgress, 0.95) * SOAK_SHARE
}

export function progressForChapter(chapter: number): number {
  const start = CHAPTER_STARTS[chapter] ?? 0
  const end = CHAPTER_STARTS[chapter + 1] ?? 1
  return (start + end) / 2
}
