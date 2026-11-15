import type { TownTree } from '../../../data/productTown'
import type { GroundPoint } from '../../../lib/storyPath'
import { treePit } from '../scene3d/trees'

/** The soil probe in a sensor tree's pit, after the home page's sensor but smaller. */
export const PROBE = {
  width: 0.7,
  height: 0.45,
  /** How far it sits in the soil. */
  sunk: 0.1,
  cap: 0.24,
  capHeight: 0.08,
  color: '#2B2E2B',
} as const

export const PIT_TOP = treePit.kerbHeight + treePit.soilHeight
export const PROBE_TOP = PIT_TOP - PROBE.sunk + PROBE.height + PROBE.capHeight

// Inside the kerb, with a little soil between them.
const FROM_TRUNK = treePit.radius - treePit.kerbWidth - PROBE.width * 0.6 - 0.15

/** Where the probe stands: on the side of the pit that faces the tree's stop on the road. */
export function probeAt(tree: TownTree): GroundPoint {
  const [x, z] = tree.at
  const away = Math.hypot(tree.stop[0] - x, tree.stop[1] - z) || 1
  return [
    x + ((tree.stop[0] - x) / away) * FROM_TRUNK,
    z + ((tree.stop[1] - z) / away) * FROM_TRUNK,
  ]
}
