import { describe, expect, it } from 'vitest'
import { SHOWER_LEVEL, progressForLevel, reachedPoints, soakLevel, soakOption } from './soakLevel'

describe('soakLevel', () => {
  it('beginnt beim ersten Messpunkt und endet ganz unten', () => {
    expect(reachedPoints(soakLevel(0))).toBe(1)
    expect(soakLevel(1)).toBe(1)
  })

  it('lässt sich in einen Fortschritt zurückrechnen', () => {
    expect(soakLevel(progressForLevel(SHOWER_LEVEL))).toBeCloseTo(SHOWER_LEVEL)
  })
})

describe('reachedPoints', () => {
  it('zählt die Messpunkte, die das Wasser schon erreicht hat', () => {
    expect(reachedPoints(0.1)).toBe(0)
    expect(reachedPoints(SHOWER_LEVEL)).toBe(1)
    expect(reachedPoints(0.6)).toBe(2)
    expect(reachedPoints(1)).toBe(3)
  })
})

describe('soakOption', () => {
  it('meldet gründliches Gießen erst, wenn der tiefste Punkt erreicht ist', () => {
    expect(soakOption(0.6)).toBe('shower')
    expect(soakOption(0.9)).toBe('soak')
  })
})
