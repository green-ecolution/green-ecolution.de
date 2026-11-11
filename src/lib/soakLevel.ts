// Depth of each measuring point as a share of the water layer in the probe
// illustration (y 120, 200 and 280 on a layer from y 64, 250 units tall).
export const SOAK_POINTS = [0.224, 0.544, 0.864]

// The play starts at the first point, as after a short shower, so there is no
// fully dry state that would need a text of its own.
const SURFACE_LEVEL = 0.25

export function soakLevel(progress: number): number {
  return SURFACE_LEVEL + Math.min(1, Math.max(0, progress)) * (1 - SURFACE_LEVEL)
}

export function reachedPoints(level: number): number {
  return SOAK_POINTS.filter((point) => level >= point).length
}

// Without a pinned stage the water sinks in by itself once, after a moment on
// the short shower. Stepped, it jumps from point to point instead of flowing.
const AUTO_HOLD_MS = 1200
const AUTO_SOAK_MS = 3600
export const AUTO_SOAK_TOTAL_MS = AUTO_HOLD_MS + AUTO_SOAK_MS

export function autoSoakProgress(elapsedMs: number, stepped: boolean): number {
  const t = Math.min(1, Math.max(0, (elapsedMs - AUTO_HOLD_MS) / AUTO_SOAK_MS))
  if (stepped) return Math.floor(t * (SOAK_POINTS.length - 1)) / (SOAK_POINTS.length - 1)
  return 1 - (1 - t) ** 2
}

// The water gets the first half of the pinned stretch; installation and setup
// share the rest. Each later chapter starts where the previous one ends.
const CHAPTER_STARTS = [0, 0.5, 0.75]
const SOAK_SHARE = CHAPTER_STARTS[1]

export function hardwareChapter(progress: number): { chapter: number; soakProgress: number } {
  const chapter = CHAPTER_STARTS.filter((start) => progress >= start).length - 1
  return { chapter: Math.max(0, chapter), soakProgress: Math.min(1, progress / SOAK_SHARE) }
}

export function progressForChapter(chapter: number): number {
  const start = CHAPTER_STARTS[chapter] ?? 0
  const end = CHAPTER_STARTS[chapter + 1] ?? 1
  return (start + end) / 2
}
