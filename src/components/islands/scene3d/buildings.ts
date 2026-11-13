import { ExtrudeGeometry, Matrix4, Shape, type BufferGeometry } from 'three'
import { painted, placed } from '../../../lib/paintedGeometry'
import {
  baysFor,
  blockTones,
  depotDepth,
  depotDoor,
  depotHeight,
  depotRoofHeight,
  depotWidth,
  doorSpec,
  parapet,
  tourColors,
  windowSpec,
  type CityBlock,
  type GroundPoint,
} from '../../../data/streamletTour'
import { unitBox } from './primitives'

const ROOF_SLAB = 0.22
const ROOF_OVERHANG = 0.35

/**
 * Two slabs leaning against each other over the ridge, with the gable ends
 * left open for the wall colour underneath to show. `alongX` runs the ridge
 * along x; otherwise it runs along z.
 */
function gableRoof(
  at: readonly [number, number, number],
  span: number,
  length: number,
  rise: number,
  alongX: boolean,
  color: string,
): BufferGeometry[] {
  const half = span / 2
  const pitch = Math.atan2(rise, half)
  const slope = Math.hypot(half, rise) + ROOF_OVERHANG
  const turn = alongX ? new Matrix4().makeRotationY(Math.PI / 2) : new Matrix4()

  return [1, -1].map((side) =>
    painted(
      unitBox,
      new Matrix4()
        .makeTranslation(...at)
        .multiply(turn)
        .multiply(new Matrix4().makeTranslation(0, rise, 0))
        .multiply(new Matrix4().makeRotationZ(side * pitch))
        // lifted a hair off the gable prism underneath so the two never z-fight
        .multiply(new Matrix4().makeTranslation((side * -slope) / 2, ROOF_SLAB / 2 + 0.03, 0))
        .multiply(new Matrix4().makeScale(slope, ROOF_SLAB, length + ROOF_OVERHANG * 2)),
      color,
    ),
  )
}

/** The triangular wall piece under a gable roof, standing on the eaves line. */
function gableEnds(
  at: readonly [number, number, number],
  span: number,
  length: number,
  rise: number,
  alongX: boolean,
  color: string,
): BufferGeometry {
  const shape = new Shape()
  shape.moveTo(-span / 2, 0)
  shape.lineTo(span / 2, 0)
  shape.lineTo(0, rise)
  shape.closePath()

  const prism = new ExtrudeGeometry(shape, { depth: length, bevelEnabled: false })
  prism.translate(0, 0, -length / 2)
  const turn = alongX ? new Matrix4().makeRotationY(Math.PI / 2) : new Matrix4()
  return painted(prism, new Matrix4().makeTranslation(...at).multiply(turn), color)
}

/**
 * Windows as boxes a little proud of the wall, one row per storey and as many
 * across as the face has room for. Only the two faces the camera sees get any.
 */
function facadeOpenings(block: CityBlock): BufferGeometry[] {
  const parts: BufferGeometry[] = []
  const storey = block.height / block.floors
  const { width, height, gap, relief } = windowSpec

  for (const face of ['+x', '+z'] as const) {
    const faceLength = face === '+x' ? block.depth : block.width
    const bays = baysFor(faceLength)
    const row = bays * width + (bays - 1) * gap
    const hasDoor = block.door === face
    const doorClearance = (doorSpec.width + width) / 2 + 0.2

    for (let floor = 0; floor < block.floors; floor++) {
      const y = floor * storey + windowSpec.sill + height / 2

      for (let bay = 0; bay < bays; bay++) {
        const along = -row / 2 + width / 2 + bay * (width + gap)
        if (hasDoor && floor === 0 && Math.abs(along) < doorClearance) continue

        parts.push(
          face === '+x'
            ? painted(
                unitBox,
                placed(
                  [block.x + block.width / 2 + relief / 2, y, block.z + along],
                  [relief, height, width],
                ),
                tourColors.window,
              )
            : painted(
                unitBox,
                placed(
                  [block.x + along, y, block.z + block.depth / 2 + relief / 2],
                  [width, height, relief],
                ),
                tourColors.window,
              ),
        )
      }
    }

    if (hasDoor) {
      const y = doorSpec.height / 2
      parts.push(
        face === '+x'
          ? painted(
              unitBox,
              placed(
                [block.x + block.width / 2 + relief / 2, y, block.z],
                [relief, doorSpec.height, doorSpec.width],
              ),
              tourColors.door,
            )
          : painted(
              unitBox,
              placed(
                [block.x, y, block.z + block.depth / 2 + relief / 2],
                [doorSpec.width, doorSpec.height, relief],
              ),
              tourColors.door,
            ),
      )
    }
  }

  return parts
}

function flatRoof(block: CityBlock): BufferGeometry[] {
  const top = block.height
  const inner = parapet.width
  return [
    painted(
      unitBox,
      placed([block.x, top + 0.04, block.z], [block.width - inner, 0.08, block.depth - inner]),
      tourColors.blockRoof,
    ),
    ...[1, -1].map((side) =>
      painted(
        unitBox,
        placed(
          [block.x + (side * (block.width - inner)) / 2, top + parapet.height / 2, block.z],
          [inner, parapet.height, block.depth],
        ),
        tourColors.blockShaded,
      ),
    ),
    ...[1, -1].map((side) =>
      painted(
        unitBox,
        placed(
          [block.x, top + parapet.height / 2, block.z + (side * (block.depth - inner)) / 2],
          [block.width, parapet.height, inner],
        ),
        tourColors.blockShaded,
      ),
    ),
  ]
}

export function blockGeometry(block: CityBlock): BufferGeometry[] {
  const tone = blockTones[block.tone]
  const parts = [
    painted(
      unitBox,
      placed([block.x, block.height / 2, block.z], [block.width, block.height, block.depth]),
      tone,
    ),
    ...facadeOpenings(block),
  ]

  if (block.roof === 'flat') {
    parts.push(...flatRoof(block))
  } else {
    const alongX = block.width >= block.depth
    const span = alongX ? block.depth : block.width
    const length = alongX ? block.width : block.depth
    const eaves = [block.x, block.height, block.z] as const
    parts.push(
      gableEnds(eaves, span, length, block.roofHeight, alongX, tone),
      ...gableRoof(eaves, span, length, block.roofHeight, alongX, tourColors.blockGableRoof),
    )
  }

  return parts
}

export function depotGeometry(at: GroundPoint): BufferGeometry[] {
  const [x, z] = at
  const eaves = [x, depotHeight, z] as const
  const relief = windowSpec.relief

  return [
    painted(
      unitBox,
      placed([x, depotHeight / 2, z], [depotWidth, depotHeight, depotDepth]),
      tourColors.depot,
    ),
    gableEnds(eaves, depotDepth, depotWidth, depotRoofHeight, true, tourColors.depot),
    ...gableRoof(eaves, depotDepth, depotWidth, depotRoofHeight, true, tourColors.depotRoof),
    // the gate faces the road, so the vehicle parks in front of it
    painted(
      unitBox,
      placed(
        [x + depotWidth / 2 + relief / 2, depotDoor.height / 2, z],
        [relief, depotDoor.height, depotDoor.width],
      ),
      tourColors.depotDoor,
    ),
    ...[0.25, 0.5, 0.75].map((share) =>
      painted(
        unitBox,
        placed(
          [x + depotWidth / 2 + relief, depotDoor.height * share, z],
          [relief, 0.08, depotDoor.width],
        ),
        tourColors.depot,
      ),
    ),
  ]
}
