import { describe, expect, it } from 'vitest'
import { pinProgress, pinnedStep, progressForStep } from './pinnedSteps'

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
  it('teilt den Fortschritt gleichmäßig auf die Schritte auf', () => {
    expect(pinnedStep(0, 3)).toEqual({ index: 0, fill: 0 })
    expect(pinnedStep(0.5, 3)).toEqual({ index: 1, fill: 0.5 })
  })

  it('bleibt am Ende beim letzten Schritt mit voller Linie', () => {
    expect(pinnedStep(1, 3)).toEqual({ index: 2, fill: 1 })
  })
})

describe('progressForStep', () => {
  it('springt in die Mitte des Abschnitts eines Schritts', () => {
    expect(progressForStep(0, 4)).toBe(0.125)
    expect(progressForStep(3, 4)).toBe(0.875)
  })

  it('führt zurück auf denselben Schritt', () => {
    for (let index = 0; index < 3; index++) {
      expect(pinnedStep(progressForStep(index, 3), 3).index).toBe(index)
    }
  })
})
