import { exampleSpots, heroTree, storyTrees } from '../../../data/storyTown'
import { pinsShown, type StoryState } from '../../../lib/storyTimeline'
import { PIN_RADIUS, pinHeight } from '../scene3d/pinSize'
import { PIT_TOP } from './shared'

export { PIN_HULL, PIN_POST, PIN_RADIUS, pinHeadScale, pinHeight } from '../scene3d/pinSize'

/** The tree pins and ours, which comes up last. */
export const PIN_TOTAL = storyTrees.length + 1

export const heroPinUp = (state: StoryState) => pinsShown(state.pins, PIN_TOTAL) >= PIN_TOTAL

/** Our tree's pin, once up, is red until the watering has brought the tree back. */
export const heroPinRed = (state: StoryState) => heroPinUp(state) && state.health <= 0.5

export const SENSOR_X = heroTree.at[0] + 1.2
export const SENSOR_Z = heroTree.at[1] + 0.55

export const sensorAnchor: readonly [number, number, number] = [SENSOR_X, PIT_TOP, SENSOR_Z]

export interface Anchor {
  at: readonly [number, number, number]
  shown: (state: StoryState) => boolean
}

export const heroLabel: Anchor = {
  at: [heroTree.at[0], pinHeight(heroTree) + PIN_RADIUS + 0.5, heroTree.at[1]],
  shown: heroPinRed,
}

export const exampleLabels: Anchor[] = exampleSpots.map((spot, index) => ({
  at: [spot.at[0], spot.pinHeight + PIN_RADIUS + 0.5, spot.at[1]],
  shown: (state) => state.examples[index].alert,
}))
