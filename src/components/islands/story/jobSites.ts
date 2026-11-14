import { exampleSpots, icePatch, puddle } from '../../../data/storyTown'
import { fractionNear, pathLength, vehiclePose, type GroundPoint } from '../../../lib/storyPath'
import { WHEELBASE } from '../scene3d/Vehicle'
import { NOZZLE_AHEAD, SPINNER_BEHIND } from './vehicles'

const [, winter, rain] = exampleSpots

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const span = (value: number, from: number, to: number) => clamp01((value - from) / (to - from))

export const gritterPath = winter.approach
const gritterWay = pathLength(gritterPath)
/** How far behind the spinner the grit comes down. */
export const GRIT_THROW = 1.2
// The gritter comes down the side road towards -z and meets the patch at its +z end.
export const iceStartZ = icePatch.at[1] + icePatch.length / 2
const iceStartsAfter =
  fractionNear(gritterPath, [icePatch.at[0], iceStartZ]) * gritterWay + SPINNER_BEHIND + GRIT_THROW

/** The share of its way at which the gritter's grit first lands on the ice. */
export const iceReachedAt = iceStartsAfter / gritterWay

/** How much of the ice patch is gritted once the gritter has come `work` of its way. */
export function grittedLength(work: number): number {
  return Math.min(icePatch.length, Math.max(0, work * gritterWay - iceStartsAfter))
}

const parked = vehiclePose(rain.approach, 1, WHEELBASE)

/** Where the parked sewer truck's suction hose meets the road. */
export const suctionAt: GroundPoint = [
  parked.at[0] + Math.sin(parked.heading) * NOZZLE_AHEAD,
  parked.at[1] + Math.cos(parked.heading) * NOZZLE_AHEAD,
]

// The hose comes down first and goes back up last, with the pumping in between.
export const hoseLowered = (work: number) => span(work, 0, 0.12) * (1 - span(work, 0.88, 1))
export const pumped = (work: number) => span(work, 0.12, 0.88)

/** The puddle drains towards the hose. */
export function puddlePose(drained: number): { at: GroundPoint; scale: number } {
  return {
    at: [
      puddle.at[0] + (suctionAt[0] - puddle.at[0]) * drained,
      puddle.at[1] + (suctionAt[1] - puddle.at[1]) * drained,
    ],
    scale: 1 - drained,
  }
}
