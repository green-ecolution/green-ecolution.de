import { AUTO_STORY_MS } from './storyTimeline'

// Three times the autoplay's pace: quick enough to keep up with reading,
// slow enough that the vehicle still visibly drives.
export const MAX_RATE = 3 / (AUTO_STORY_MS / 1000)
// What is left to play after a cut. Must stay below the lead of a jump to an
// example (0.6 of its span, about 0.067), or the cut lands in the one before.
export const MAX_LAG = 0.06
// The same after a backward jump. Must stay below what is left of an example
// past a jump's landing (0.4 of its span, about 0.045), or it lands in the next.
export const MAX_LEAD = 0.04
// How long the scroll position has to stand still before the scene may cut.
export const SETTLE_MS = 150
// The longest frame that counts: a stalled or throttled page must neither
// pass for rest nor make the scene leap.
export const MAX_FRAME_SECONDS = 0.05
// How quickly the scene eases in once it is close to the scroll position.
const FOLLOW = 7
const ARRIVED = 0.0005

/** How long the scroll position has rested after one more frame of `seconds`. */
export function restedFor(restingMs: number, seconds: number): number {
  return restingMs + Math.min(seconds, MAX_FRAME_SECONDS) * 1000
}

/**
 * The scene's next progress on its way to the scroll position: an ease-in
 * close by, never faster than MAX_RATE, and a cut to MAX_LAG short of the
 * target (MAX_LEAD past it going back) once the target has rested
 * `restingMs` and is still far away.
 */
export function chaseStory(
  current: number,
  target: number,
  seconds: number,
  restingMs: number,
): number {
  let from = current
  if (restingMs >= SETTLE_MS) {
    if (target - from > MAX_LAG) from = target - MAX_LAG
    else if (from - target > MAX_LEAD) from = target + MAX_LEAD
  }

  const gap = target - from
  if (Math.abs(gap) < ARRIVED) return target
  const step = Math.min(seconds, MAX_FRAME_SECONDS)
  const eased = Math.abs(gap) * (1 - Math.exp(-step * FOLLOW))
  return from + Math.sign(gap) * Math.min(eased, MAX_RATE * step)
}
