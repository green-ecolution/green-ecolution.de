import { describe, expect, it } from 'vitest'
import { MAX_DRY_DAYS, moisture, thirst } from './dryness'

describe('moisture', () => {
  it('ist nach Regen voll und fällt mit jedem trockenen Tag', () => {
    expect(moisture(0.1, 0)).toBe(1)
    expect(moisture(0.1, 3)).toBeCloseTo(0.7)
    expect(moisture(0.1, 6)).toBeLessThan(moisture(0.1, 3))
  })

  it('wird nie negativ', () => {
    expect(moisture(0.2, MAX_DRY_DAYS)).toBe(0)
  })
})

describe('thirst', () => {
  it('teilt die Feuchte in die drei Ampelfarben', () => {
    expect(thirst(1)).toBe('ok')
    expect(thirst(0.5)).toBe('ok')
    expect(thirst(0.49)).toBe('soon')
    expect(thirst(0.25)).toBe('soon')
    expect(thirst(0.24)).toBe('dry')
    expect(thirst(0)).toBe('dry')
  })
})
