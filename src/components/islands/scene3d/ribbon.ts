import { BufferGeometry, Float32BufferAttribute, Vector3, type CatmullRomCurve3 } from 'three'

export interface RibbonArrays {
  position: number[]
  normal: number[]
  index: number[]
}

export function appendRibbon(
  arrays: RibbonArrays,
  curve: CatmullRomCurve3,
  width: number,
  lift: number,
  from: number,
  to: number,
  segments: number,
) {
  const half = width / 2
  const side = new Vector3()
  const base = arrays.position.length / 3

  for (let i = 0; i <= segments; i++) {
    const at = from + ((to - from) * i) / segments
    const point = curve.getPointAt(at)
    const tangent = curve.getTangentAt(at)
    side.set(-tangent.z, 0, tangent.x).normalize().multiplyScalar(half)

    arrays.position.push(point.x + side.x, point.y + lift, point.z + side.z)
    arrays.position.push(point.x - side.x, point.y + lift, point.z - side.z)
    arrays.normal.push(0, 1, 0, 0, 1, 0)
  }

  for (let i = 0; i < segments; i++) {
    const corner = base + i * 2
    arrays.index.push(corner, corner + 1, corner + 2, corner + 1, corner + 3, corner + 2)
  }
}

export function ribbonGeometry(arrays: RibbonArrays) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(arrays.position, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(arrays.normal, 3))
  geometry.setIndex(arrays.index)
  return geometry
}
