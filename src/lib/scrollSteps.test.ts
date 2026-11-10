import { describe, expect, it } from 'vitest'
import { activeStepIndex } from './scrollSteps'

const VIEWPORT = 1000

describe('activeStepIndex', () => {
  it('bleibt beim ersten Schritt, solange noch keiner die Lesezeile erreicht hat', () => {
    const tops = [800, 1400, 2000]
    expect(activeStepIndex(tops, VIEWPORT)).toBe(0)
  })

  it('wählt den letzten Schritt, dessen Oberkante die Lesezeile passiert hat', () => {
    const tops = [-300, 400, 1000]
    expect(activeStepIndex(tops, VIEWPORT)).toBe(1)
  })

  it('bleibt beim letzten Schritt, wenn alle schon nach oben gescrollt sind', () => {
    const tops = [-2000, -1400, -800]
    expect(activeStepIndex(tops, VIEWPORT)).toBe(2)
  })

  it('liefert 0 für eine leere Liste', () => {
    expect(activeStepIndex([], VIEWPORT)).toBe(0)
  })
})
