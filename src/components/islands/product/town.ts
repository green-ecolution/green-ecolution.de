import { CylinderGeometry, Matrix4, type BufferGeometry } from 'three'
import {
  blocks,
  depot,
  hydrant,
  looseTrees,
  park,
  plate,
  pond,
  roads,
  square,
  townTrees,
  type TownTree,
} from '../../../data/productTown'
import { lawnHeight, roadHeight, tourColors, type Tree } from '../../../data/streamletTour'
import { merged, painted, placed } from '../../../lib/paintedGeometry'
import type { GroundPoint } from '../../../lib/storyPath'
import { blockGeometry, depotGeometry } from '../scene3d/buildings'
import { roundedSlab, unitBox, unitCylinder, unitDisc } from '../scene3d/primitives'
import { roadGeometry } from '../scene3d/roads'
import { treeGeometry, treePitGeometry } from '../scene3d/trees'
import { WATER } from '../scene3d/waterJet'
import { PIT_TOP, PROBE, probeAt } from './probe'

// The crowns of the sensor trees change colour and are drawn on their own.
function trunkGeometry(tree: Tree): BufferGeometry {
  return painted(
    new CylinderGeometry(0.24, 0.34, 1, 8),
    placed([tree.at[0], tree.trunkHeight / 2, tree.at[1]], [1, tree.trunkHeight, 1]),
    tourColors.treeTrunk,
  )
}

/** The standpipe's crossbar, along x; the hose hangs from the end nearer the truck. */
export const HYDRANT_ARM = { height: 1.7, half: 0.95 } as const

// A standpipe, larger than life so it reads as the place to refill.
function hydrantGeometry([x, z]: GroundPoint): BufferGeometry[] {
  return [
    painted(unitCylinder, placed([x, 0.15, z], [1.5, 0.3, 1.5]), tourColors.kerb),
    painted(unitCylinder, placed([x, 1.4, z], [0.45, 2.2, 0.45]), WATER),
    painted(unitCylinder, placed([x, 2.65, z], [0.62, 0.3, 0.62]), WATER),
    painted(unitBox, placed([x, HYDRANT_ARM.height, z], [HYDRANT_ARM.half * 2, 0.36, 0.36]), WATER),
  ]
}

function probeGeometry(tree: TownTree): BufferGeometry[] {
  const [x, z] = probeAt(tree)
  const bottom = PIT_TOP - PROBE.sunk
  return [
    painted(
      unitBox,
      placed([x, bottom + PROBE.height / 2, z], [PROBE.width, PROBE.height, PROBE.width]),
      PROBE.color,
    ),
    painted(
      unitBox,
      placed(
        [x, bottom + PROBE.height + PROBE.capHeight / 2, z],
        [PROBE.cap, PROBE.capHeight, PROBE.cap],
      ),
      tourColors.refill,
    ),
  ]
}

function slab(
  area: { x: number; z: number; width: number; depth: number },
  radius: number,
  height: number,
  color: string,
): BufferGeometry {
  return painted(
    roundedSlab(area.width, area.depth, radius, height),
    new Matrix4().makeTranslation(area.x, 0, area.z),
    color,
  )
}

export const groundGeometry = roundedSlab(
  plate.width,
  plate.depth,
  plate.radius,
  plate.thickness,
).translate(0, -plate.thickness, 0)

// Nothing in here ever moves, so it is one geometry and one draw call. The
// houses get windows all round because the camera rides through the town.
export const townGeometry = merged([
  ...roads.flatMap(roadGeometry),
  ...blocks.flatMap((block) => blockGeometry(block, true)),
  ...depotGeometry(depot.at),
  slab(park, 1.6, lawnHeight, tourColors.lawn),
  slab(square, 1, 0.1, tourColors.blockTop),
  painted(
    unitDisc,
    placed([pond.at[0], lawnHeight + 0.02, pond.at[1]], [pond.radiusX, 1, pond.radiusZ]),
    tourColors.water,
  ),
  ...townTrees.flatMap(treePitGeometry),
  ...townTrees.map(trunkGeometry),
  ...townTrees.flatMap(probeGeometry),
  ...looseTrees.flatMap(treeGeometry),
  ...hydrantGeometry(hydrant.at),
])

export const shadowGeometry = merged(
  [...townTrees, ...looseTrees].map((tree) => {
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
