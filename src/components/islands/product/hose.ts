import {
  BufferGeometry,
  Color,
  CubicBezierCurve3,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Vector3,
} from 'three'
import { WATER, WATER_GLINT } from '../scene3d/waterJet'

const RINGS = 48
const SIDES = 8
const RADIUS = 0.14
/** Light bands along the hose, and hoses' lengths they travel per second. */
const BANDS = 7
const FLOW = 0.6

const body = new Color(WATER)
const glint = new Color(WATER_GLINT)

export function hoseGeometry(): BufferGeometry {
  const index: number[] = []
  for (let ring = 0; ring < RINGS - 1; ring++) {
    for (let side = 0; side < SIDES; side++) {
      const a = ring * SIDES + side
      const b = ring * SIDES + ((side + 1) % SIDES)
      index.push(a, b + SIDES, b, a, a + SIDES, b + SIDES)
    }
  }
  const geometry = new BufferGeometry()
  const vertices = RINGS * SIDES
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(new Float32Array(vertices * 3), 3).setUsage(DynamicDrawUsage),
  )
  geometry.setAttribute(
    'normal',
    new Float32BufferAttribute(new Float32Array(vertices * 3), 3).setUsage(DynamicDrawUsage),
  )
  geometry.setAttribute(
    'color',
    new Float32BufferAttribute(new Float32Array(vertices * 3), 3).setUsage(DynamicDrawUsage),
  )
  geometry.setIndex(index)
  return geometry
}

const curve = new CubicBezierCurve3(new Vector3(), new Vector3(), new Vector3(), new Vector3())
const point = new Vector3()
const tangent = new Vector3()
const side = new Vector3()
const lift = new Vector3()
const UP = new Vector3(0, 1, 0)
const ACROSS = new Vector3(1, 0, 0)
const tint = new Color()

/**
 * Lays the hose from the hydrant's outlet to the filler dome: it drops to the
 * ground first, then climbs over the tank and comes down into the dome.
 * `reach` is the drawn share from the hydrant on, `time` moves the bands.
 */
export function shapeHose(
  geometry: BufferGeometry,
  outlet: Vector3,
  dome: Vector3,
  reach: number,
  time: number,
) {
  const towardTruck = side.subVectors(dome, outlet).setY(0).normalize()
  curve.v0.copy(outlet)
  curve.v1.copy(outlet).addScaledVector(towardTruck, 1.2).setY(0.3)
  curve.v2
    .copy(dome)
    .addScaledVector(towardTruck, -1.4)
    .setY(dome.y + 1.6)
  curve.v3.copy(dome)

  const position = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')
  const color = geometry.getAttribute('color')
  for (let ring = 0; ring < RINGS; ring++) {
    const along = ring / (RINGS - 1)
    curve.getPoint(along, point)
    curve.getTangent(along, tangent)
    side.crossVectors(tangent, Math.abs(tangent.y) > 0.95 ? ACROSS : UP).normalize()
    lift.crossVectors(side, tangent).normalize()
    const wave = 0.5 + 0.5 * Math.sin(2 * Math.PI * (along * BANDS - time * FLOW * BANDS))
    tint.copy(body).lerp(glint, wave ** 3 * 0.75)
    for (let corner = 0; corner < SIDES; corner++) {
      const angle = (corner / SIDES) * Math.PI * 2
      const nx = side.x * Math.cos(angle) + lift.x * Math.sin(angle)
      const ny = side.y * Math.cos(angle) + lift.y * Math.sin(angle)
      const nz = side.z * Math.cos(angle) + lift.z * Math.sin(angle)
      const vertex = ring * SIDES + corner
      position.setXYZ(vertex, point.x + nx * RADIUS, point.y + ny * RADIUS, point.z + nz * RADIUS)
      normal.setXYZ(vertex, nx, ny, nz)
      color.setXYZ(vertex, tint.r, tint.g, tint.b)
    }
  }
  position.needsUpdate = true
  normal.needsUpdate = true
  color.needsUpdate = true
  geometry.setDrawRange(0, Math.round(reach * (RINGS - 1)) * SIDES * 6)
}
