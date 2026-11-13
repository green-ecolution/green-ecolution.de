import { pinnedStep } from './pinnedSteps'
import { ACT_WEIGHTS } from './storyTimeline'

// How much scrolling each act gets, apart from how long it plays by itself:
// the finale tells three examples, each wants about as much as an early act.
export const SCROLL_WEIGHTS: number[] = [1, 1, 1.5, 5]

// Share of each act's scrolling that holds its finished picture before the
// next act begins: more gives a calmer pause, but less room to play.
export const ACT_HOLD = 0.15
// The timeline switches act exactly at the boundary, so a held act rests just before it.
const HELD_FILL = 0.999

export interface StepBox {
  top: number
  height: number
}

/**
 * How far a reading line has come through a column of steps, each step
 * claiming the share of the story its weight gives it.
 */
export function progressFromSteps(line: number, boxes: StepBox[], weights: number[]): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let before = 0

  for (const [index, box] of boxes.entries()) {
    if (line < box.top) return before / total
    if (line < box.top + box.height) {
      return (before + ((line - box.top) / box.height) * weights[index]) / total
    }
    before += weights[index]
  }

  return 1
}

/** Where the reading line has to be for the story to stand at `progress`. */
export function offsetForProgress(progress: number, boxes: StepBox[], weights: number[]): number {
  const { index, fill } = pinnedStep(progress, weights)
  return boxes[index].top + fill * boxes[index].height
}

const sum = (weights: number[]) => weights.reduce((total, weight) => total + weight, 0)
const prefix = (weights: number[], index: number) => sum(weights.slice(0, index))

/**
 * Story progress for a scroll progress. The scrolling is split into acts by
 * the scroll weights; each act plays in the first part of its share and holds
 * its end in the rest. Within an act the timeline's own weights apply.
 */
export function storyFromScroll(
  scroll: number,
  scrollWeights = SCROLL_WEIGHTS,
  storyWeights = ACT_WEIGHTS,
  hold = ACT_HOLD,
): number {
  // A boundary belongs to the act that ends there, so a pause between two
  // steps, where the scroll progress stands still, holds the act before.
  const position = Math.min(1, Math.max(0, scroll)) * sum(scrollWeights)
  let index = 0
  while (index < scrollWeights.length - 1 && position > prefix(scrollWeights, index + 1)) index++
  const fill = (position - prefix(scrollWeights, index)) / scrollWeights[index]
  const end = index === scrollWeights.length - 1 ? 1 : HELD_FILL
  const played = hold > 0 ? Math.min(1, fill / (1 - hold)) * end : fill
  return (prefix(storyWeights, index) + played * storyWeights[index]) / sum(storyWeights)
}

/** The scroll progress at which the story first stands at `story`. */
export function scrollForStory(
  story: number,
  scrollWeights = SCROLL_WEIGHTS,
  storyWeights = ACT_WEIGHTS,
  hold = ACT_HOLD,
): number {
  const { index, fill } = pinnedStep(story, storyWeights)
  const end = index === storyWeights.length - 1 ? 1 : HELD_FILL
  const scrolled = hold > 0 ? (Math.min(fill, end) / end) * (1 - hold) : fill
  return (prefix(scrollWeights, index) + scrolled * scrollWeights[index]) / sum(scrollWeights)
}
