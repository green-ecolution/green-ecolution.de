// Centre of the drawing's 400 unit viewBox.
const CENTRE = 200
// How far along the ring a grab reaches to either side, in the drawing's
// units: a base width plus a share of the radius, so a small ring is bent at
// one place instead of being pushed aside as a whole.
const GRAB_WIDTH = 6
const GRAB_WIDTH_PER_RADIUS = 0.06
// Below 1 small rings give more than their size alone would allow; at 1 every
// ring would bend by the same share of its radius.
const GIVE_EXPONENT = 0.75

// Distance between two neighbouring points along a ring, in the drawing's
// units. The same for every ring, so a pluck travels equally fast on all.
const POINT_SPACING = 6

export function ringPointCount(radius: number): number {
  return Math.round((2 * Math.PI * radius) / POINT_SPACING)
}

// One ring as a closed string: how far each of its points is pushed out along
// its radius, and how fast it is moving there.
export interface RingString {
  offset: Float32Array
  speed: Float32Array
}

export interface StringShape {
  /** Pull between neighbouring points; carries a pluck along the ring. */
  tension: number
  /** Pull of every point back onto its circle; sets the pitch of the swing. */
  stiffness: number
  damping: number
}

function angleOf(index: number, count: number, turn: number): number {
  return (turn * Math.PI) / 180 + (index / count) * 2 * Math.PI
}

// `turn` is the angle in degrees at which the ring starts, clockwise from the
// right, so each ring can begin drawing itself somewhere else.
export function ringPoints(
  radius: number,
  offsets: ArrayLike<number>,
  turn: number,
): { x: number; y: number }[] {
  return Array.from({ length: offsets.length }, (_, index) => {
    const angle = angleOf(index, offsets.length, turn)
    const reach = radius + offsets[index]
    return { x: CENTRE + reach * Math.cos(angle), y: CENTRE + reach * Math.sin(angle) }
  })
}

// A smooth closed curve: every point is the control point of one arc that
// runs between the midpoints to its neighbours.
export function ringPath(radius: number, offsets: ArrayLike<number>, turn: number): string {
  const points = ringPoints(radius, offsets, turn)
  const midway = (index: number) => {
    const from = points[(index + points.length) % points.length]
    const to = points[(index + 1) % points.length]
    return `${((from.x + to.x) / 2).toFixed(2)} ${((from.y + to.y) / 2).toFixed(2)}`
  }
  const arcs = points.map(
    (point, index) => `Q${point.x.toFixed(2)} ${point.y.toFixed(2)} ${midway(index)}`,
  )
  return `M${midway(-1)}${arcs.join('')}Z`
}

// Holds the string at the pointer: the point under it follows completely, its
// neighbours less the further along the ring they sit. `angle` is in radians.
export function grabString(
  { offset, speed }: RingString,
  angle: number,
  pull: number,
  radius: number,
  turn: number,
): void {
  const count = offset.length
  const width = GRAB_WIDTH + radius * GRAB_WIDTH_PER_RADIUS
  for (let index = 0; index < count; index++) {
    const apart = Math.atan2(
      Math.sin(angleOf(index, count, turn) - angle),
      Math.cos(angleOf(index, count, turn) - angle),
    )
    const along = apart * radius
    const hold = Math.exp(-(along * along) / (2 * width * width))
    offset[index] += (pull - offset[index]) * hold
    speed[index] *= 1 - hold
  }
}

// How much of a pull a ring follows, from 0 to 1. The same pull would bend a
// small ring far more visibly than a large one, so small rings are stiffer.
export function ringGive(radius: number, outermost: number): number {
  return Math.min(1, (radius / outermost) ** GIVE_EXPONENT)
}

// One step of the string swinging freely.
export function stepString(
  { offset, speed }: RingString,
  dt: number,
  { tension, stiffness, damping }: StringShape,
): void {
  const count = offset.length
  for (let index = 0; index < count; index++) {
    const before = offset[(index + count - 1) % count]
    const after = offset[(index + 1) % count]
    const bend = before + after - 2 * offset[index]
    speed[index] += (tension * bend - stiffness * offset[index] - damping * speed[index]) * dt
  }
  for (let index = 0; index < count; index++) offset[index] += speed[index] * dt
}

// Whether the pointer passed over the ring between two frames, given its
// distance from the centre before and now.
export function crossedRing(before: number, now: number, radius: number): boolean {
  return before < radius !== now < radius
}
