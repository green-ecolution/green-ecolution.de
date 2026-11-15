import { Matrix4, type BufferGeometry } from 'three'
import {
  binHeight,
  blocks,
  depotAt,
  exampleSpots,
  gully,
  heroTree,
  lawn,
  plate,
  roads,
  storyTrees,
} from '../../../data/storyTown'
import { lawnHeight, roadHeight, tourColors } from '../../../data/streamletTour'
import { merged, painted, placed } from '../../../lib/paintedGeometry'
import type { GroundPoint } from '../../../lib/storyPath'
import { blockGeometry, depotGeometry } from '../scene3d/buildings'
import { roadGeometry } from '../scene3d/roads'
import { roundedSlab, unitBox, unitCylinder, unitDisc } from '../scene3d/primitives'
import { treeGeometry, treePitGeometry } from '../scene3d/trees'

// Larger than life, so it still reads as a bin on a small stage.
function binGeometry([x, z]: GroundPoint): BufferGeometry[] {
  return [
    painted(unitCylinder, placed([x, binHeight / 2, z], [0.8, binHeight, 0.8]), tourColors.depot),
    painted(
      unitCylinder,
      placed([x, binHeight + 0.08, z], [0.92, 0.16, 0.92]),
      tourColors.depotRoof,
    ),
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
  ...blocks.flatMap((block) => blockGeometry(block)),
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
