// The booth screen is the floor these numbers have to clear: the Pi's Touch
// Display 2 runs rotated at 1280x720, so asking for the 1920x1080 the scenes
// are drawn for would put the gate in front of the fair, not in front of a
// phone. Height matters as much as width because the loop never scrolls.
export const SHOWCASE_MIN_WIDTH = 1000
export const SHOWCASE_MIN_HEIGHT = 560

export const SHOWCASE_MEDIA_QUERY =
  `(min-width: ${SHOWCASE_MIN_WIDTH}px) and (min-height: ${SHOWCASE_MIN_HEIGHT}px)` as const

export function fitsShowcase({ width, height }: { width: number; height: number }): boolean {
  return width >= SHOWCASE_MIN_WIDTH && height >= SHOWCASE_MIN_HEIGHT
}
