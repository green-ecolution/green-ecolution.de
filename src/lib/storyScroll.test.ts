import { describe, expect, it } from 'vitest'
import { offsetForProgress, progressFromSteps, type StepBox } from './storyScroll'

const weights = [1, 1, 1.5, 2.5]
const boxes: StepBox[] = [
  { top: 100, height: 200 },
  { top: 300, height: 200 },
  { top: 500, height: 300 },
  { top: 800, height: 500 },
]

describe('progressFromSteps', () => {
  it('ist vor dem ersten Schritt 0 und nach dem letzten 1', () => {
    expect(progressFromSteps(50, boxes, weights)).toBe(0)
    expect(progressFromSteps(2000, boxes, weights)).toBe(1)
  })

  it('gewichtet die Schritte wie die Akte', () => {
    expect(progressFromSteps(200, boxes, weights)).toBeCloseTo(0.5 / 6)
    expect(progressFromSteps(300, boxes, weights)).toBeCloseTo(1 / 6)
    expect(progressFromSteps(650, boxes, weights)).toBeCloseTo(2.75 / 6)
  })

  it('bleibt in einer Lücke zwischen zwei Schritten stehen', () => {
    const gapped: StepBox[] = [
      { top: 0, height: 100 },
      { top: 150, height: 100 },
    ]
    expect(progressFromSteps(120, gapped, [1, 1])).toBe(0.5)
  })
})

describe('offsetForProgress', () => {
  it('ist die Umkehrung von progressFromSteps', () => {
    for (const line of [150, 300, 420, 650, 1100]) {
      const progress = progressFromSteps(line, boxes, weights)
      expect(offsetForProgress(progress, boxes, weights)).toBeCloseTo(line)
    }
  })

  it('endet am unteren Rand des letzten Schritts', () => {
    expect(offsetForProgress(1, boxes, weights)).toBe(1300)
  })
})
