import { heroTree } from '../../../data/storyTown'
import { canopyCenterHeight, type Tree } from '../../../data/streamletTour'
import type { StoryState } from '../../../lib/storyTimeline'
import { PIT_TOP } from './shared'

export const PIN_RADIUS = 0.78
export const PIN_POST = 1.8

export const pinHeight = (tree: Tree) =>
  canopyCenterHeight(tree) + tree.canopyRadius + PIN_POST + 0.2

export const SENSOR_X = heroTree.at[0] + 1.2
export const SENSOR_Z = heroTree.at[1] + 0.55

export const sensorAnchor: readonly [number, number, number] = [SENSOR_X, PIT_TOP, SENSOR_Z]

export interface Anchor {
  at: readonly [number, number, number]
  shown: (state: StoryState) => boolean
}

export const heroLabel: Anchor = {
  at: [heroTree.at[0], pinHeight(heroTree) + PIN_RADIUS + 0.5, heroTree.at[1]],
  shown: (state) => state.alert,
}
