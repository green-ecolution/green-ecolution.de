import { describe, expect, it } from 'vitest'
import { pinnedStep, scrollOffsetForStep } from './pinnedSteps'

const DISTANCE = 1500
const STEPS = 3

describe('pinnedStep', () => {
  it('beginnt mit dem ersten Schritt, bevor der Pin-Bereich erreicht ist', () => {
    expect(pinnedStep(-200, DISTANCE, STEPS)).toEqual({ index: 0, fill: 0 })
  })

  it('teilt die Scrollstrecke gleichmäßig auf die Schritte auf', () => {
    expect(pinnedStep(250, DISTANCE, STEPS)).toEqual({ index: 0, fill: 0.5 })
    expect(pinnedStep(500, DISTANCE, STEPS)).toEqual({ index: 1, fill: 0 })
    expect(pinnedStep(1250, DISTANCE, STEPS)).toEqual({ index: 2, fill: 0.5 })
  })

  it('bleibt nach dem Pin-Bereich beim letzten Schritt mit voller Linie', () => {
    expect(pinnedStep(1500, DISTANCE, STEPS)).toEqual({ index: 2, fill: 1 })
    expect(pinnedStep(4000, DISTANCE, STEPS)).toEqual({ index: 2, fill: 1 })
  })

  it('kommt ohne Scrollstrecke aus', () => {
    expect(pinnedStep(0, 0, STEPS)).toEqual({ index: 0, fill: 1 })
  })
})

describe('scrollOffsetForStep', () => {
  it('springt in die Mitte des Abschnitts eines Schritts', () => {
    expect(scrollOffsetForStep(0, DISTANCE, STEPS)).toBe(250)
    expect(scrollOffsetForStep(2, DISTANCE, STEPS)).toBe(1250)
  })

  it('führt zurück auf denselben Schritt', () => {
    for (let index = 0; index < STEPS; index++) {
      const offset = scrollOffsetForStep(index, DISTANCE, STEPS)
      expect(pinnedStep(offset, DISTANCE, STEPS).index).toBe(index)
    }
  })
})
