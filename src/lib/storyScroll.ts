import { pinnedStep } from './pinnedSteps'

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
