import { CylinderGeometry, type BufferGeometry } from 'three'
import { painted, placed } from '../../../lib/paintedGeometry'
import { canopyCenterHeight, tourColors, type Tree } from '../../../data/streamletTour'
import { unitCylinder, unitLobe } from './primitives'

// A kerbed pit of soil around every tree the tour waters: the pit is what the
// sensors sit in and the water goes into.
export const treePit = {
  radius: 2.2,
  kerbWidth: 0.3,
  kerbHeight: 0.18,
  soilHeight: 0.1,
} as const

export function treePitGeometry(tree: Tree): BufferGeometry[] {
  const [x, z] = tree.at
  return [
    painted(
      unitCylinder,
      placed([x, treePit.kerbHeight / 2, z], [treePit.radius, treePit.kerbHeight, treePit.radius]),
      tourColors.treePitKerb,
    ),
    painted(
      unitCylinder,
      placed(
        [x, treePit.kerbHeight + treePit.soilHeight / 2, z],
        [
          treePit.radius - treePit.kerbWidth,
          treePit.soilHeight,
          treePit.radius - treePit.kerbWidth,
        ],
      ),
      tourColors.treePitSoil,
    ),
  ]
}

export interface Lobe {
  at: readonly [number, number, number]
  radius: number
}

// A crown of four lobes around the body, mirrored on every other tree so a row
// of them does not read as copies.
export const lobes: Lobe[] = [
  { at: [0, 0, 0], radius: 1 },
  { at: [0.55, -0.2, 0.35], radius: 0.7 },
  { at: [-0.5, -0.15, -0.4], radius: 0.65 },
  { at: [0.1, 0.55, -0.15], radius: 0.6 },
]

export function treeGeometry(tree: Tree, index: number): BufferGeometry[] {
  const [x, z] = tree.at
  const crown = tree.canopyRadius
  const mirror = index % 2 === 0 ? 1 : -1
  const lit = tree.dark ? tourColors.treeCanopyDark : tourColors.treeCanopyLit
  const body = tree.dark ? tourColors.treeCanopyDeep : tourColors.treeCanopy

  return [
    painted(
      new CylinderGeometry(0.24, 0.34, 1, 8),
      placed([x, tree.trunkHeight / 2, z], [1, tree.trunkHeight, 1]),
      tourColors.treeTrunk,
    ),
    ...lobes.map((lobe, lobeIndex) =>
      painted(
        unitLobe,
        placed(
          [
            x + lobe.at[0] * crown * mirror,
            canopyCenterHeight(tree) + lobe.at[1] * crown,
            z + lobe.at[2] * crown,
          ],
          [lobe.radius * crown, lobe.radius * crown, lobe.radius * crown],
        ),
        lobeIndex === 0 ? body : lit,
      ),
    ),
  ]
}
