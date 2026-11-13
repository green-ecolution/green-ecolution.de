import { describe, expect, it } from 'vitest'
import { pinProgress, pinnedStep } from './pinnedSteps'

describe('pinProgress', () => {
  it('bleibt vor dem Pin-Bereich bei 0', () => {
    expect(pinProgress(-200, 1500)).toBe(0)
  })

  it('wächst linear mit der Scrollstrecke', () => {
    expect(pinProgress(750, 1500)).toBe(0.5)
  })

  it('bleibt nach dem Pin-Bereich bei 1', () => {
    expect(pinProgress(4000, 1500)).toBe(1)
  })

  it('kommt ohne Scrollstrecke aus', () => {
    expect(pinProgress(0, 0)).toBe(1)
  })
})

describe('pinnedStep', () => {
  it('teilt den Fortschritt bei gleichen Gewichten gleichmäßig auf', () => {
    expect(pinnedStep(0, [1, 1, 1])).toEqual({ index: 0, fill: 0 })
    expect(pinnedStep(0.5, [1, 1, 1])).toEqual({ index: 1, fill: 0.5 })
  })

  it('gibt schwereren Schritten mehr Scrollstrecke', () => {
    expect(pinnedStep(0.25, [1, 1, 2])).toEqual({ index: 1, fill: 0 })
    expect(pinnedStep(0.5, [1, 1, 2])).toEqual({ index: 2, fill: 0 })
    expect(pinnedStep(0.75, [1, 1, 2])).toEqual({ index: 2, fill: 0.5 })
  })

  it('bleibt am Ende beim letzten Schritt mit voller Linie', () => {
    expect(pinnedStep(1, [1, 1, 2])).toEqual({ index: 2, fill: 1 })
  })
})
