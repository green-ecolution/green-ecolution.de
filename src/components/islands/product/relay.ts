import { depot, gateway, type TownTree } from '../../../data/productTown'
import { depotHeight, depotRoofHeight } from '../../../data/streamletTour'
import type { Vec3 } from '../../../lib/cameraPose'
import { PROBE_TOP, probeAt } from './probe'

export const GATEWAY_TIP: Vec3 = [gateway.at[0], gateway.base + gateway.height, gateway.at[1]]
/** Over the ridge of the depot's hall, where the message comes in. */
export const DEPOT_ROOF: Vec3 = [depot.at[0], depotHeight + depotRoofHeight + 0.6, depot.at[1]]

/** The message's two hops: up from the probe to the gateway, over from there to the depot. */
export type RelayHop = 'up' | 'over'

/** How high over the straight line each hop arches at its middle. */
const LIFT: Record<RelayHop, number> = { up: 6, over: 9 }
/** Share of the first hop the dot takes to grow, and of the second to go into the depot. */
const GROW_SHARE = 0.2
const FADE_SHARE = 0.2

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const smooth = (t: number) => t * t * (3 - 2 * t)

export interface RelayDot {
  at: Vec3
  /** 0 hidden, 1 full size. */
  size: number
}

/** Where the message of a tree's probe is: on its way up to the gateway, or over to the depot. */
export function relayDot(tree: TownTree, hop: RelayHop, share: number): RelayDot {
  const [x, z] = probeAt(tree)
  const from: Vec3 = hop === 'up' ? [x, PROBE_TOP + 0.5, z] : GATEWAY_TIP
  const to = hop === 'up' ? GATEWAY_TIP : DEPOT_ROOF
  const t = smooth(clamp01(share))
  return {
    at: [
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t + LIFT[hop] * 4 * t * (1 - t),
      from[2] + (to[2] - from[2]) * t,
    ],
    size:
      hop === 'up'
        ? smooth(clamp01(share / GROW_SHARE))
        : 1 - smooth(clamp01((share - (1 - FADE_SHARE)) / FADE_SHARE)),
  }
}
