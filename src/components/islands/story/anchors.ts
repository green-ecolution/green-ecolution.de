import { exampleSpots, heroTree, storyTrees } from '../../../data/storyTown'
import { canopyCenterHeight, type Tree } from '../../../data/streamletTour'
import { pinsShown, type StoryState } from '../../../lib/storyTimeline'
import { PIT_TOP } from './shared'

export const PIN_RADIUS = 0.78
export const PIN_POST = 1.8
/** The white outline around a pin's head, relative to its radius. */
export const PIN_HULL = 1.14
// Smallest head radius in css pixels: the town shot is the picture for
// "understand", and its pins have to read on a phone-sized stage.
const MIN_HEAD_PX = 7

/** How much a pin's head is enlarged; an orthographic zoom is css pixels per world unit. */
export const pinHeadScale = (zoom: number) => Math.max(1, MIN_HEAD_PX / (PIN_RADIUS * zoom))

export const pinHeight = (tree: Tree) =>
  canopyCenterHeight(tree) + tree.canopyRadius + PIN_POST + 0.2

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
