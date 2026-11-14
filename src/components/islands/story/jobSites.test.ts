import { describe, expect, it } from 'vitest'
import { icePatch, puddle } from '../../../data/storyTown'
import { GRITTER_SLOWS_AT } from '../../../lib/storyTimeline'
import { grittedLength, hoseLowered, iceReachedAt, puddlePose, pumped, suctionAt } from './jobSites'

describe('grittedLength', () => {
  it('wächst mit dem Weg des Streuers und deckt am Ende die ganze Eisfläche', () => {
    expect(grittedLength(0)).toBe(0)
    expect(grittedLength(1)).toBe(icePatch.length)
    let previous = 0
    for (let step = 1; step <= 100; step++) {
      const gritted = grittedLength(step / 100)
      expect(gritted).toBeGreaterThanOrEqual(previous)
      previous = gritted
    }
  })

  it('beginnt dort, wo die Geschichte den Streuer langsamer fahren lässt', () => {
    expect(grittedLength(iceReachedAt)).toBeCloseTo(0)
    expect(grittedLength(iceReachedAt + 0.01)).toBeGreaterThan(0)
    expect(Math.abs(iceReachedAt - GRITTER_SLOWS_AT)).toBeLessThan(0.05)
  })
})

describe('Abpumpen', () => {
  const fromHose = (at: readonly [number, number]) =>
    Math.hypot(at[0] - suctionAt[0], at[1] - suctionAt[1])

  it('setzt den Saugschlauch in die Pfütze', () => {
    expect(fromHose(puddle.at)).toBeLessThan(puddle.radius)
  })

  it('lässt die Pfütze zum Schlauch hin schrumpfen, bis sie weg ist', () => {
    expect(puddlePose(0)).toEqual({ at: puddle.at, scale: 1 })
    for (let step = 0; step < 100; step++) {
      const { at, scale } = puddlePose(step / 100)
      expect(fromHose(at)).toBeLessThan(puddle.radius * scale)
    }
    expect(puddlePose(1).scale).toBe(0)
  })

  it('pumpt nur, solange der Schlauch im Wasser hängt', () => {
    expect(hoseLowered(0)).toBe(0)
    expect(hoseLowered(1)).toBe(0)
    for (let step = 0; step <= 100; step++) {
      const work = step / 100
      if (pumped(work) > 0 && pumped(work) < 1) expect(hoseLowered(work)).toBe(1)
    }
    expect(pumped(0)).toBe(0)
    expect(pumped(1)).toBe(1)
  })
})
