import { BufferAttribute, Color, Matrix4, type BufferGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export function placed(
  at: readonly [number, number, number],
  scale: readonly [number, number, number],
) {
  return new Matrix4().makeTranslation(...at).multiply(new Matrix4().makeScale(...scale))
}

/** A copy of one part, put where it belongs and carrying its colour per vertex. */
export function painted(geometry: BufferGeometry, matrix: Matrix4, color: string): BufferGeometry {
  const moved = geometry.clone().applyMatrix4(matrix)
  // mergeGeometries refuses a mixed set, and the canopy lobes come off a
  // polyhedron, which three builds without an index.
  const part = moved.index ? moved.toNonIndexed() : moved
  const tint = new Color(color)
  const colors = new Float32Array(part.attributes.position.count * 3)

  for (let i = 0; i < colors.length; i += 3) {
    colors[i] = tint.r
    colors[i + 1] = tint.g
    colors[i + 2] = tint.b
  }

  part.setAttribute('color', new BufferAttribute(colors, 3))
  return part
}

export function merged(parts: BufferGeometry[]): BufferGeometry {
  const geometry = mergeGeometries(parts)

  if (!geometry) {
    throw new Error('the geometry could not be merged')
  }

  return geometry
}
