import { describe, expect, it } from 'vitest'
import {
  SHOWER_LEVEL,
  hardwareChapter,
  progressForChapter,
  progressForLevel,
  progressForSoak,
  reachedPoints,
  soakLevel,
  soakOption,
} from './soakLevel'

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

describe('hardwareChapter', () => {
  it('lässt das Wasser in der ersten Hälfte steigen', () => {
    expect(hardwareChapter(0.25)).toEqual({ chapter: 0, soakProgress: 0.5 })
  })

  it('wechselt danach zu Einbau und Einrichtung', () => {
    expect(hardwareChapter(0.6).chapter).toBe(1)
    expect(hardwareChapter(0.9).chapter).toBe(2)
    expect(hardwareChapter(1).chapter).toBe(2)
  })

  it('hält das Wasser nach der ersten Station voll', () => {
    expect(hardwareChapter(0.9).soakProgress).toBe(1)
  })

  it('führt mit den Sprungzielen zurück auf die passende Station', () => {
    expect(hardwareChapter(progressForSoak(1)).chapter).toBe(0)
    expect(reachedPoints(soakLevel(hardwareChapter(progressForSoak(1)).soakProgress))).toBe(3)
    for (const chapter of [0, 1, 2]) {
      expect(hardwareChapter(progressForChapter(chapter)).chapter).toBe(chapter)
    }
  })
})
