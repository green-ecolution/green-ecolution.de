import { describe, expect, it } from 'vitest'
import { phaseOfStep, pinProgress, pinnedStep, progressForStep } from './pinnedSteps'

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

describe('progressForStep', () => {
  it('springt in die Mitte des Abschnitts eines Schritts', () => {
    expect(progressForStep(0, [1, 1, 1, 1])).toBe(0.125)
    expect(progressForStep(3, [1, 1, 1, 1])).toBe(0.875)
  })

  it('öffnet einen Schritt mit mehreren Bildern beim ersten Bild', () => {
    const weights = [1, 1, 2]
    const { index, fill } = pinnedStep(progressForStep(2, weights), weights)
    expect(index).toBe(2)
    expect(phaseOfStep(fill, 2)).toBe(0)
  })

  it('führt zurück auf denselben Schritt', () => {
    const weights = [1, 1, 2]
    for (let index = 0; index < weights.length; index++) {
      expect(pinnedStep(progressForStep(index, weights), weights).index).toBe(index)
    }
  })
})

describe('phaseOfStep', () => {
  it('teilt einen Schritt mit mehreren Bildern in gleich lange Phasen', () => {
    expect(phaseOfStep(0.2, 2)).toBe(0)
    expect(phaseOfStep(0.6, 2)).toBe(1)
  })

  it('bleibt am Ende des Schritts bei der letzten Phase', () => {
    expect(phaseOfStep(1, 2)).toBe(1)
  })

  it('hat bei nur einem Bild immer Phase 0', () => {
    expect(phaseOfStep(0.9, 1)).toBe(0)
  })
})

describe('progressForStep mit Ansicht', () => {
  const weights = [2, 2, 2]

  it('landet ohne Angabe in der ersten Ansicht des Schritts', () => {
    const { index, fill } = pinnedStep(progressForStep(1, weights), weights)
    expect(index).toBe(1)
    expect(phaseOfStep(fill, weights[1])).toBe(0)
  })

  it('landet mitten in der gewünschten Ansicht', () => {
    const { index, fill } = pinnedStep(progressForStep(1, weights, 1), weights)
    expect(index).toBe(1)
    expect(phaseOfStep(fill, weights[1])).toBe(1)
  })

  it('bleibt im Schritt, auch wenn es die Ansicht nicht gibt', () => {
    expect(pinnedStep(progressForStep(2, weights, 5), weights).index).toBe(2)
  })
})
