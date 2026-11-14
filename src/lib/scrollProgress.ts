export interface ProgressRange {
  /** Share of the window height where the element's top starts the progress. */
  start: number
  /** Share of the window height where the element's bottom completes it. */
  end: number
}

// How far an element has travelled through the window, from 0 to 1.
export function scrollProgress(
  top: number,
  height: number,
  viewport: number,
  { start, end }: ProgressRange,
): number {
  const distance = (start - end) * viewport + height
  if (distance <= 0) return 1
  return Math.min(1, Math.max(0, (start * viewport - top) / distance))
}

// Near the end of a page an element may never climb to its finish line. The
// line then moves to where its bottom stands once the page is scrolled out, as
// a share of the window height, so the progress still completes.
export function reachableRange(range: ProgressRange, bottomAtPageEnd: number): ProgressRange {
  return { start: range.start, end: Math.max(range.end, bottomAtPageEnd) }
}
