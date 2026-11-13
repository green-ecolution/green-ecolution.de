import { Matrix4, type BufferGeometry } from 'three'
import {
  blocks,
  depotAt,
  exampleSpots,
  gully,
  heroTree,
  lawn,
  plate,
  roads,
  storyTrees,
  type Road,
} from '../../../data/storyTown'
import {
  centerLine,
  kerb,
  lawnHeight,
  roadHeight,
  roadWidth,
  tourColors,
} from '../../../data/streamletTour'
import { merged, painted, placed } from '../../../lib/paintedGeometry'
import type { GroundPoint } from '../../../lib/storyPath'
import { blockGeometry, depotGeometry } from '../scene3d/buildings'
import { roundedSlab, unitBox, unitCylinder, unitDisc } from '../scene3d/primitives'
import { treeGeometry, treePitGeometry } from '../scene3d/trees'

function roadGeometry(road: Road): BufferGeometry[] {
  const [fromX, fromZ] = road.from
  const [toX, toZ] = road.to
  const alongX = fromZ === toZ
  const length = alongX ? Math.abs(toX - fromX) : Math.abs(toZ - fromZ)
  const x = (fromX + toX) / 2
  const z = (fromZ + toZ) / 2
  const box = (width: number, height: number): [number, number, number] =>
    alongX ? [length, height, width] : [width, height, length]
  const kerbTop = roadHeight - kerb.drop

  const pattern = centerLine.dash + centerLine.gap
  const dashes = Array.from({ length: Math.floor(length / pattern) }, (_, index) => {
    const along = -length / 2 + centerLine.gap / 2 + index * pattern + centerLine.dash / 2
    return painted(
      unitBox,
      placed(
        alongX
          ? [x + along, roadHeight + centerLine.lift, z]
          : [x, roadHeight + centerLine.lift, z + along],
        alongX
          ? [centerLine.dash, 0.02, centerLine.width]
          : [centerLine.width, 0.02, centerLine.dash],
      ),
      tourColors.roadLine,
    )
  })

  return [
    painted(
      unitBox,
      placed([x, kerbTop / 2, z], box(roadWidth + kerb.width * 2, kerbTop)),
      tourColors.kerb,
    ),
    painted(unitBox, placed([x, roadHeight / 2, z], box(roadWidth, roadHeight)), tourColors.road),
    ...dashes,
  ]
}

function binGeometry([x, z]: GroundPoint): BufferGeometry[] {
  return [
    painted(unitCylinder, placed([x, 0.8, z], [0.7, 1.6, 0.7]), tourColors.depot),
    painted(unitCylinder, placed([x, 1.68, z], [0.8, 0.16, 0.8]), tourColors.depotRoof),
  ]
}

function gullyGeometry([x, z]: GroundPoint): BufferGeometry {
  return painted(
    unitBox,
    placed([x, roadHeight + 0.02, z], [1.6, 0.04, 1.1]),
    tourColors.vehicleWheel,
  )
}

const side = plate.half * 2
const trees = [...storyTrees, heroTree]
const bin = exampleSpots[0]

export const groundGeometry = roundedSlab(side, side, plate.radius, plate.thickness).translate(
  0,
  -plate.thickness,
  0,
)

// Nothing in here ever moves, so it is one geometry and one draw call. Our own
// tree is left out: its crown changes colour and is drawn on its own.
export const townGeometry = merged([
  ...roads.flatMap(roadGeometry),
  ...blocks.flatMap(blockGeometry),
  ...depotGeometry(depotAt),
  painted(
    roundedSlab(lawn.width, lawn.depth, 1.2, lawnHeight),
    new Matrix4().makeTranslation(lawn.x, 0, lawn.z),
    tourColors.lawn,
  ),
  ...trees.flatMap(treePitGeometry),
  ...storyTrees.flatMap(treeGeometry),
  ...binGeometry(bin.at),
  gullyGeometry(gully.at),
])

export const shadowGeometry = merged(
  trees.map((tree) => {
    const radius = tree.canopyRadius * 0.95
    return unitDisc
      .clone()
      .applyMatrix4(
        placed(
          [tree.at[0] + radius * 0.25, roadHeight + 0.1, tree.at[1] + radius * 0.2],
          [radius, 1, radius],
        ),
      )
  }),
)
