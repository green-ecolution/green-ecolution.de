import { describe, expect, it } from 'vitest'
import {
  AUTO_SOAK_TOTAL_MS,
  autoSoakProgress,
  chapterProgress,
  hardwareChapter,
  progressForChapter,
  reachedPoints,
  revealedCount,
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
  it('lässt das Wasser im ersten Drittel steigen', () => {
    expect(hardwareChapter(1 / 6)).toEqual({ chapter: 0, soakProgress: 0.5 })
  })

  it('wechselt danach zu Einbau und Einrichtung', () => {
    expect(hardwareChapter(0.5).chapter).toBe(1)
    expect(hardwareChapter(0.9).chapter).toBe(2)
    expect(hardwareChapter(1).chapter).toBe(2)
  })

  it('gibt Einbau und Einrichtung je so viel Scrollweg wie dem Wasser', () => {
    expect(hardwareChapter(0.3).chapter).toBe(0)
    expect(hardwareChapter(0.6).chapter).toBe(1)
    expect(hardwareChapter(0.7).chapter).toBe(2)
  })

  it('hält das Wasser nach der ersten Station voll', () => {
    expect(hardwareChapter(0.9).soakProgress).toBe(1)
  })

  it('führt mit den Sprungzielen zurück auf die passende Station', () => {
    for (const chapter of [0, 1, 2]) {
      expect(hardwareChapter(progressForChapter(chapter)).chapter).toBe(chapter)
    }
  })

  it('springt dorthin, wo die Teile einer Station schon alle da sind', () => {
    for (const chapter of [1, 2]) {
      const landed = chapterProgress(progressForChapter(chapter), chapter)
      expect(revealedCount(landed, 3)).toBe(3)
    }
  })
})

describe('chapterProgress', () => {
  it('misst den Weg durch eine einzelne Station', () => {
    expect(chapterProgress(1 / 6, 0)).toBeCloseTo(0.5)
    expect(chapterProgress(0.5, 1)).toBeCloseTo(0.5)
    expect(chapterProgress(1, 2)).toBe(1)
  })

  it('bleibt vor der Station leer und danach voll', () => {
    expect(chapterProgress(0.1, 2)).toBe(0)
    expect(chapterProgress(0.9, 0)).toBe(1)
  })
})

describe('revealedCount', () => {
  it('zeigt am Anfang einer Station noch nichts', () => {
    expect(revealedCount(0, 3)).toBe(0)
  })

  it('lässt die Teile nacheinander erscheinen', () => {
    expect(revealedCount(0.2, 3)).toBe(1)
    expect(revealedCount(0.4, 3)).toBe(2)
  })

  it('ist fertig, bevor die Station endet', () => {
    expect(revealedCount(0.6, 3)).toBe(3)
    expect(revealedCount(1, 3)).toBe(3)
  })
})
