import { describe, expect, it } from 'vitest'
import { smoothDamp } from './smoothDamp'

function glide(from: number, to: number, smoothTime: number, step: number, seconds: number) {
  const values = [from]
  let value = from
  let velocity = 0
  for (let time = 0; time < seconds; time += step) {
    ;[value, velocity] = smoothDamp(value, velocity, to, smoothTime, step)
    values.push(value)
  }
  return { values, velocity }
}

describe('smoothDamp', () => {
  it('fährt aus der Ruhe sanft an', () => {
    const { values } = glide(0, 10, 0.9, 1 / 60, 0.2)
    const first = values[1] - values[0]
    const later = values[6] - values[5]
    expect(first).toBeGreaterThan(0)
    expect(first).toBeLessThan(0.002 * 10)
    expect(later).toBeGreaterThan(first * 4)
  })

  it('schießt nie über das Ziel hinaus', () => {
    for (const step of [1 / 120, 1 / 30, 0.05, 0.3]) {
      const { values } = glide(-4, 6, 0.9, step, 10)
      values.forEach((value, index) => {
        expect(value).toBeLessThanOrEqual(6)
        if (index > 0) expect(value).toBeGreaterThanOrEqual(values[index - 1])
      })
    }
  })

  it('kommt an und bleibt stehen', () => {
    const { values, velocity } = glide(10, 2, 0.9, 1 / 60, 6)
    expect(values.at(-1)).toBeCloseTo(2, 3)
    expect(Math.abs(velocity)).toBeLessThan(1e-3)
  })

  it('braucht mit der doppelten Glättzeit ungefähr doppelt so lange', () => {
    const halfway = (smoothTime: number) =>
      glide(0, 1, smoothTime, 1 / 120, 10).values.findIndex((value) => value >= 0.5)
    expect(halfway(1.8) / halfway(0.9)).toBeCloseTo(2, 1)
  })

  it('bleibt ohne verstrichene Zeit, wo es ist', () => {
    expect(smoothDamp(3, 1.5, 8, 0.9, 0)).toEqual([3, 1.5])
  })
})
