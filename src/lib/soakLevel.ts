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

// Water, installation and setup each get a third of the pinned stretch. Each
// later chapter starts where the previous one ends.
const CHAPTER_STARTS = [0, 1 / 3, 2 / 3]
const SOAK_SHARE = CHAPTER_STARTS[1]

export function hardwareChapter(progress: number): { chapter: number; soakProgress: number } {
  const chapter = CHAPTER_STARTS.filter((start) => progress >= start).length - 1
  return { chapter: Math.max(0, chapter), soakProgress: Math.min(1, progress / SOAK_SHARE) }
}

// Lands late enough in a chapter that its parts have all arrived.
const LANDING_SHARE = 0.75

export function progressForChapter(chapter: number): number {
  const start = CHAPTER_STARTS[chapter] ?? 0
  const end = CHAPTER_STARTS[chapter + 1] ?? 1
  return start + (end - start) * LANDING_SHARE
}

export function chapterProgress(progress: number, chapter: number): number {
  const start = CHAPTER_STARTS[chapter] ?? 0
  const end = CHAPTER_STARTS[chapter + 1] ?? 1
  return Math.min(1, Math.max(0, (progress - start) / (end - start)))
}

// The parts of a chapter arrive one after another and are all there well
// before it ends, so the last one can still be read.
const REVEAL_START = 0.15
const REVEAL_END = 0.6

export function revealedCount(progress: number, count: number): number {
  if (progress < REVEAL_START) return 0
  if (count <= 1) return count
  const share = (progress - REVEAL_START) / (REVEAL_END - REVEAL_START)
  return Math.min(count, Math.floor(share * (count - 1) + 1e-9) + 1)
}
