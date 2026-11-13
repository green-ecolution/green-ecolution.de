import { describe, expect, it } from 'vitest'
import { pinnedStep } from './pinnedSteps'
import {
  EXAMPLES,
  progressAt,
  progressForAct,
  progressForExample,
  storyState,
} from './storyTimeline'
import {
  ACT_HOLD,
  SCROLL_WEIGHTS,
  offsetForProgress,
  progressFromSteps,
  scrollForStory,
  storyFromScroll,
  type StepBox,
} from './storyScroll'

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

describe('storyFromScroll', () => {
  const total = 6
  const actEnds = [1, 2, 3.5, 6].map((end) => end / total)
  const actStarts = [0, 1, 2, 3.5].map((start) => start / total)
  const same = (scroll: number) => storyFromScroll(scroll, weights, weights)

  it('läuft von 0 bis 1 und nie rückwärts', () => {
    for (const scrollWeights of [weights, SCROLL_WEIGHTS]) {
      expect(storyFromScroll(0, scrollWeights)).toBe(0)
      expect(storyFromScroll(1, scrollWeights)).toBe(1)
      let previous = 0
      for (let step = 1; step <= 1000; step++) {
        const story = storyFromScroll(step / 1000, scrollWeights)
        expect(story).toBeGreaterThanOrEqual(previous)
        previous = story
      }
    }
  })

  it('hält am Ende jedes Akts das fertige Bild, im selben Akt', () => {
    for (const [act, end] of actEnds.entries()) {
      const holdStart = end - (ACT_HOLD * weights[act]) / total
      const held = same(holdStart + 1e-6)
      expect(same(end - 1e-6)).toBe(held)
      expect(same((holdStart + end) / 2)).toBe(held)
      expect(pinnedStep(held, weights)).toMatchObject({ index: act })
      expect(pinnedStep(held, weights).fill).toBeGreaterThan(0.99)
    }
  })

  it('spielt jeden Akt vor seiner Pause ganz durch', () => {
    for (const [act, start] of actStarts.entries()) {
      expect(same(start)).toBeCloseTo(start)
      const playEnd = start + ((1 - ACT_HOLD) * weights[act]) / total
      expect(pinnedStep(same((start + playEnd) / 2), weights).fill).toBeCloseTo(0.5, 2)
    }
  })

  it('hält an einer Grenze noch den Akt davor, etwa in der Lücke zwischen zwei Schritten', () => {
    expect(pinnedStep(same(1 / 6), weights).index).toBe(0)
    expect(pinnedStep(same(1 / 6 + 1e-6), weights).index).toBe(1)
  })

  it('ist ohne Pause und mit gleichen Gewichten die Identität', () => {
    for (const scroll of [0, 0.1, 0.5, 0.77, 1]) {
      expect(storyFromScroll(scroll, weights, weights, 0)).toBeCloseTo(scroll)
    }
  })

  it('legt die Aktgrenzen dorthin, wo die Scrollgewichte sie hinlegen', () => {
    const scrollTotal = SCROLL_WEIGHTS.reduce((sum, weight) => sum + weight, 0)
    let before = 0
    for (const [act, weight] of SCROLL_WEIGHTS.entries()) {
      expect(storyState(storyFromScroll((before + 1e-6) / scrollTotal)).act).toBe(act)
      expect(storyState(storyFromScroll((before + weight - 1e-6) / scrollTotal)).act).toBe(act)
      before += weight
    }
  })

  it('gibt jedem Beispiel des Finales mindestens eine Einheit Scrollstrecke', () => {
    const scrollTotal = SCROLL_WEIGHTS.reduce((sum, weight) => sum + weight, 0)
    // An example runs from 0.1 of the finale in spans of 0.27, see storyTimeline.ts.
    const exampleStart = (index: number) => progressAt(3, 0.1 + index * 0.27)
    const lengths = EXAMPLES.map(
      (_, index) =>
        (scrollForStory(exampleStart(index + 1)) - scrollForStory(exampleStart(index))) *
        scrollTotal,
    )
    for (const length of lengths) expect(length).toBeGreaterThanOrEqual(1)
    expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThan(1e-9)
  })
})

describe('scrollForStory', () => {
  it('ist außerhalb der Pausen die Umkehrung von storyFromScroll', () => {
    for (const scroll of [0.02, 0.05, 0.12, 0.2, 0.3, 0.45, 0.6, 0.8, 0.9]) {
      expect(scrollForStory(storyFromScroll(scroll))).toBeCloseTo(scroll)
    }
  })

  it('führt jedes Sprungziel auf denselben Fortschritt der Geschichte zurück', () => {
    const targets = [
      ...[0, 1, 2, 3].map(progressForAct),
      ...EXAMPLES.map((_, index) => progressForExample(index)),
      1,
    ]
    for (const story of targets) {
      expect(storyFromScroll(scrollForStory(story))).toBeCloseTo(story, 9)
    }
  })

  it('springt nie in eine Pause hinein', () => {
    expect(scrollForStory(0.999 / 6, weights, weights)).toBeLessThanOrEqual(
      (1 - ACT_HOLD) / 6 + 1e-9,
    )
  })
})
