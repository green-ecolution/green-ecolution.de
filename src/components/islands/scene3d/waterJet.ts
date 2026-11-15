import { BufferGeometry, Color, DynamicDrawUsage, Float32BufferAttribute, Vector3 } from 'three'

export const WATER = '#2B7FBF'
export const WATER_GLINT = '#BFE2F5'

export interface JetArc {
  from: Vector3
  to: Vector3
  /** How far the water climbs above the nozzle before it falls. */
  rise: number
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** Share of the watering the first water needs to reach the ground, and the last to fall. */
const FLIGHT = 0.16

/** The stretch of the flight that carries water, both ends as shares of the way to the ground. */
export function jetSpan(watering: number): { tail: number; head: number } {
  return {
    tail: 1 - clamp01((1 - watering) / FLIGHT),
    head: clamp01(watering / FLIGHT),
  }
}

// Thrown water keeps its level speed, so `at` is a share of the way and of the flight time alike.
function launchSpeed({ from, to, rise }: JetArc): number {
  const drop = from.y - to.y
  return 2 * rise + 2 * Math.sqrt(Math.max(0, rise * rise + rise * drop))
}

export function jetPoint(arc: JetArc, at: number, target: Vector3): Vector3 {
  const up = launchSpeed(arc)
  const drop = arc.from.y - arc.to.y
  return target.lerpVectors(arc.from, arc.to, at).setY(arc.from.y + up * at - (up + drop) * at * at)
}

const NOZZLE_RADIUS = 0.12
const FAN = 0.18

/** The jet fans out on its way down. */
export function jetRadius(at: number): number {
  return NOZZLE_RADIUS + FAN * at ** 1.4
}

const RINGS = 28
const SIDES = 7
const TAIL_CAP = RINGS * SIDES
const HEAD_CAP = TAIL_CAP + 1
// A loose end rounds off over this share of the way.
const ROUNDING = 0.1
const SWELLS = 3
const GLINTS = 2.4
/** Ways from nozzle to ground the surface travels per second. */
const FLOW = 1.3

const body = new Color(WATER)
const glint = new Color(WATER_GLINT)

export function jetGeometry(): BufferGeometry {
  const index: number[] = []
  for (let ring = 0; ring < RINGS - 1; ring++) {
    for (let side = 0; side < SIDES; side++) {
      const a = ring * SIDES + side
      const b = ring * SIDES + ((side + 1) % SIDES)
      index.push(a, b, b + SIDES, a, b + SIDES, a + SIDES)
    }
  }
  const last = (RINGS - 1) * SIDES
  for (let side = 0; side < SIDES; side++) {
    const next = (side + 1) % SIDES
    index.push(TAIL_CAP, next, side, HEAD_CAP, last + side, last + next)
  }

  const vertices = RINGS * SIDES + 2
  const geometry = new BufferGeometry()
  const position = new Float32BufferAttribute(new Float32Array(vertices * 3), 3)
  const color = new Float32BufferAttribute(new Float32Array(vertices * 4), 4)
  geometry.setAttribute('position', position.setUsage(DynamicDrawUsage))
  geometry.setAttribute('color', color.setUsage(DynamicDrawUsage))
  geometry.setIndex(index)
  return geometry
}

const centre = new Vector3()
const tangent = new Vector3()
const across = new Vector3()
const upward = new Vector3()
const tint = new Color()

/** Lays the jet along the stretch from `tail` to `head`; `time` moves the water in it. */
export function shapeJet(
  geometry: BufferGeometry,
  arc: JetArc,
  tail: number,
  head: number,
  time: number,
) {
  const position = geometry.getAttribute('position')
  const color = geometry.getAttribute('color')
  const up = launchSpeed(arc)
  const drop = arc.from.y - arc.to.y
  const flowed = FLOW * time

  for (let ring = 0; ring < RINGS; ring++) {
    const at = tail + ((head - tail) * ring) / (RINGS - 1)
    jetPoint(arc, at, centre)
    tangent
      .subVectors(arc.to, arc.from)
      .setY(up - 2 * (up + drop) * at)
      .normalize()
    across.set(-tangent.z, 0, tangent.x).normalize()
    upward.crossVectors(tangent, across)

    // The jet leaves the nozzle and meets the ground at full width; only an end in the air is round.
    const tip = head < 1 ? Math.sqrt(clamp01((head - at) / ROUNDING)) : 1
    const end = tail > 0 ? Math.sqrt(clamp01((at - tail) / ROUNDING)) : 1
    const swell = 1 + 0.2 * clamp01(at * 5) * Math.sin(2 * Math.PI * SWELLS * (at - flowed))
    const radius = jetRadius(at) * swell * tip * end
    const opacity = 0.95 - 0.2 * at

    for (let side = 0; side < SIDES; side++) {
      const turn = (2 * Math.PI * side) / SIDES
      const x = Math.cos(turn) * radius
      const y = Math.sin(turn) * radius
      const vertex = ring * SIDES + side
      position.setXYZ(
        vertex,
        centre.x + across.x * x + upward.x * y,
        centre.y + across.y * x + upward.y * y,
        centre.z + across.z * x + upward.z * y,
      )
      const wave = 0.5 + 0.5 * Math.sin(2 * Math.PI * GLINTS * (at - flowed) + side * 1.3)
      tint.lerpColors(body, glint, Math.min(1, 0.75 * wave ** 4 + 0.15 * at * at))
      color.setXYZW(vertex, tint.r, tint.g, tint.b, opacity)
    }

    if (ring === 0) {
      position.setXYZ(TAIL_CAP, centre.x, centre.y, centre.z)
      color.setXYZW(TAIL_CAP, body.r, body.g, body.b, opacity)
    }
    if (ring === RINGS - 1) {
      position.setXYZ(HEAD_CAP, centre.x, centre.y, centre.z)
      color.setXYZW(HEAD_CAP, body.r, body.g, body.b, opacity)
    }
  }

  position.needsUpdate = true
  color.needsUpdate = true
}
