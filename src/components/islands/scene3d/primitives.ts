import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  IcosahedronGeometry,
  Shape,
} from 'three'

export function roundedSlab(width: number, depth: number, radius: number, height: number) {
  const shape = new Shape()
  const minX = -width / 2
  const minZ = -depth / 2
  const maxX = width / 2
  const maxZ = depth / 2

  shape.moveTo(minX + radius, minZ)
  shape.lineTo(maxX - radius, minZ)
  shape.quadraticCurveTo(maxX, minZ, maxX, minZ + radius)
  shape.lineTo(maxX, maxZ - radius)
  shape.quadraticCurveTo(maxX, maxZ, maxX - radius, maxZ)
  shape.lineTo(minX + radius, maxZ)
  shape.quadraticCurveTo(minX, maxZ, minX, maxZ - radius)
  shape.lineTo(minX, minZ + radius)
  shape.quadraticCurveTo(minX, minZ, minX + radius, minZ)

  // extruded along z, then laid flat so the slab rises from y = 0 to height
  const geometry = new ExtrudeGeometry(shape, { depth: height, bevelEnabled: false })
  geometry.rotateX(-Math.PI / 2)
  return geometry
}

export const unitBox = new BoxGeometry(1, 1, 1)
export const unitCylinder = new CylinderGeometry(1, 1, 1, 16)
export const unitDisc = new CircleGeometry(1, 24).rotateX(-Math.PI / 2)
export const unitLobe = new IcosahedronGeometry(1, 1)
