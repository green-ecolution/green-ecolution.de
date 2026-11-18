export interface Point {
  x: number
  y: number
}

// Side length of the disc's square viewBox.
export const DISC_SIZE = 440
const CENTRE = DISC_SIZE / 2
// Grown wood rarely keeps its pith in the middle. The rings start around it
// and even out towards the bark, which sits centred in the drawing.
export const PITH: Point = { x: 228, y: 214 }
const OUTERMOST = 206
const SAMPLES = 40
// Furthest a leader may start from the horizontal, so it stays on the side
// that faces the entries.
const MAX_LEADER_ANGLE = (50 * Math.PI) / 180

// The same dents on every ring, as a share of its radius: a ring follows the
// shape of the one before.
function dent(angle: number): number {
  return (
    0.026 * Math.sin(2 * angle + 0.6) +
    0.018 * Math.sin(3 * angle + 2.1) +
    0.009 * Math.sin(5 * angle + 4)
  )
}

export function ringPoint(radius: number, angle: number): Point {
  const drift = 1 - radius / OUTERMOST
  const reach = radius * (1 + dent(angle))
  return {
    x: CENTRE + (PITH.x - CENTRE) * drift + reach * Math.cos(angle),
    y: CENTRE + (PITH.y - CENTRE) * drift + reach * Math.sin(angle),
  }
}

// A smooth closed curve: every point is the control point of one arc that
// runs between the midpoints to its neighbours.
export function ringOutline(radius: number): string {
  const points = Array.from({ length: SAMPLES }, (_, index) =>
    ringPoint(radius, (index / SAMPLES) * 2 * Math.PI),
  )
  const midway = (index: number) => {
    const from = points[(index + SAMPLES) % SAMPLES]
    const to = points[(index + 1) % SAMPLES]
    return `${((from.x + to.x) / 2).toFixed(1)} ${((from.y + to.y) / 2).toFixed(1)}`
  }
  const arcs = points.map(
    (point, index) => `Q${point.x.toFixed(1)} ${point.y.toFixed(1)} ${midway(index)}`,
  )
  return `M${midway(-1)}${arcs.join('')}Z`
}

export interface Leader {
  start: Point
  path: string
}

// The line from the middle of a ring's band to the row of its entry: straight
// where the band crosses the row, otherwise at 45° up or down to it first.
export function leaderLine(inner: number, outer: number, rowY: number, endX: number): Leader {
  const middle = (inner + outer) / 2
  // On the side facing the entries a point sinks as its angle grows, so the
  // row is found by halving.
  let low = -MAX_LEADER_ANGLE
  let high = MAX_LEADER_ANGLE
  for (let step = 0; step < 24; step++) {
    const angle = (low + high) / 2
    if (ringPoint(middle, angle).y < rowY) low = angle
    else high = angle
  }
  const start = ringPoint(middle, (low + high) / 2)
  const rise = Math.abs(rowY - start.y)
  const bend = rise < 0.5 ? '' : `L${(start.x + rise).toFixed(1)} ${rowY}`
  return { start, path: `M${start.x.toFixed(1)} ${start.y.toFixed(1)}${bend}H${endX}` }
}
