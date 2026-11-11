import { describe, expect, it } from 'vitest'
import {
  AUTO_SOAK_TOTAL_MS,
  autoSoakProgress,
  hardwareChapter,
  progressForChapter,
  reachedPoints,
  soakLevel,
} from './soakLevel'

describe('soakLevel', () => {
  it('beginnt beim ersten Messpunkt und endet ganz unten', () => {
    expect(reachedPoints(soakLevel(0))).toBe(1)
    expect(soakLevel(1)).toBe(1)
  })
})

describe('reachedPoints', () => {
  it('zählt die Messpunkte, die das Wasser schon erreicht hat', () => {
    expect(reachedPoints(0.1)).toBe(0)
    expect(reachedPoints(0.3)).toBe(1)
    expect(reachedPoints(0.6)).toBe(2)
    expect(reachedPoints(1)).toBe(3)
  })
})

describe('autoSoakProgress', () => {
  it('bleibt erst kurz beim Schauer und sickert dann bis ganz unten', () => {
    expect(autoSoakProgress(0, false)).toBe(0)
    expect(autoSoakProgress(1000, false)).toBe(0)
    expect(autoSoakProgress(AUTO_SOAK_TOTAL_MS, false)).toBe(1)
    expect(autoSoakProgress(AUTO_SOAK_TOTAL_MS + 5000, false)).toBe(1)
  })

  it('springt mit reduzierter Bewegung von Messpunkt zu Messpunkt', () => {
    const reachedAt = (ms: number) => reachedPoints(soakLevel(autoSoakProgress(ms, true)))
    expect(reachedAt(0)).toBe(1)
    expect(reachedAt(AUTO_SOAK_TOTAL_MS * 0.8)).toBe(2)
    expect(reachedAt(AUTO_SOAK_TOTAL_MS)).toBe(3)
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
    for (const chapter of [0, 1, 2]) {
      expect(hardwareChapter(progressForChapter(chapter)).chapter).toBe(chapter)
    }
  })
})
