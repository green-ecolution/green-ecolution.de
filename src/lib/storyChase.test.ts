import { describe, expect, it } from 'vitest'
import { MAX_LAG, MAX_LEAD, MAX_RATE, SETTLE_MS, chaseStory } from './storyChase'
import { AUTO_STORY_MS, EXAMPLES, progressForExample, storyState } from './storyTimeline'

const FRAME = 1 / 60

describe('chaseStory', () => {
  it('spielt höchstens dreimal so schnell wie das Autoplay', () => {
    expect(MAX_RATE).toBeCloseTo(3 / (AUTO_STORY_MS / 1000))
  })

  it('landet nach dem Schnitt eines Sprungs vorwärts im angesteuerten Beispiel', () => {
    EXAMPLES.forEach((_, index) => {
      const target = progressForExample(index)
      const cut = chaseStory(0, target, 0, SETTLE_MS)
      expect(target - cut).toBeCloseTo(MAX_LAG)
      expect(storyState(cut).activeExample).toBe(index)
    })
  })

  it('landet nach dem Schnitt eines Sprungs rückwärts im angesteuerten Beispiel', () => {
    EXAMPLES.forEach((_, index) => {
      const target = progressForExample(index)
      const cut = chaseStory(1, target, 0, SETTLE_MS)
      expect(cut - target).toBeCloseTo(MAX_LEAD)
      expect(storyState(cut).activeExample).toBe(index)
    })
  })

  it('bewegt sich nie schneller als MAX_RATE', () => {
    for (const [current, target] of [
      [0, 1],
      [1, 0],
      [0.2, 0.25],
      [0.5, 0.49],
      [0.3, 0.9],
    ]) {
      for (const delta of [FRAME, 1 / 144, 0.1]) {
        const next = chaseStory(current, target, delta, 0)
        expect(Math.abs(next - current)).toBeLessThanOrEqual(MAX_RATE * delta + 1e-12)
      }
    }
  })

  it('erreicht das Ziel ohne Überschwingen und bleibt dort', () => {
    for (const [start, target] of [
      [0.1, 0.1 + MAX_LAG * 0.9],
      [0.2, 0.2 - MAX_LEAD * 0.9],
      [0, MAX_LAG * 0.5],
    ]) {
      let current = start
      for (let frame = 0; frame < 600; frame++) {
        const next = chaseStory(current, target, FRAME, frame * FRAME * 1000)
        expect(Math.sign(target - next)).not.toBe(-Math.sign(target - start))
        current = next
      }
      expect(current).toBe(target)
      expect(chaseStory(current, target, FRAME, 10_000)).toBe(target)
    }
  })

  it('springt nicht, solange sich das Ziel noch bewegt', () => {
    expect(chaseStory(0, 0.9, FRAME, 0)).toBeCloseTo(MAX_RATE * FRAME)
    expect(chaseStory(0.9, 0, FRAME, SETTLE_MS - 1)).toBeCloseTo(0.9 - MAX_RATE * FRAME)
  })

  it('holt nach einer Pause vorwärts bis auf MAX_LAG und rückwärts bis auf MAX_LEAD auf', () => {
    const forwards = chaseStory(0, 0.9, FRAME, SETTLE_MS)
    expect(forwards).toBeGreaterThanOrEqual(0.9 - MAX_LAG)
    expect(forwards).toBeLessThan(0.9)

    const backwards = chaseStory(0.9, 0.1, FRAME, SETTLE_MS)
    expect(backwards).toBeLessThanOrEqual(0.1 + MAX_LEAD)
    expect(backwards).toBeGreaterThan(0.1)
  })

  it('springt bei kleinem Abstand nie', () => {
    const current = 0.5
    const ahead = chaseStory(current, current + MAX_LAG * 0.9, FRAME, 10_000)
    expect(ahead - current).toBeLessThanOrEqual(MAX_RATE * FRAME + 1e-12)
    const behind = chaseStory(current, current - MAX_LEAD * 0.9, FRAME, 10_000)
    expect(current - behind).toBeLessThanOrEqual(MAX_RATE * FRAME + 1e-12)
  })

  it('hängt nicht von der Bildrate ab', () => {
    for (const [current, target] of [
      [0.2, 0.201],
      [0.2, 0.6],
      [0.6, 0.2],
    ]) {
      const once = chaseStory(current, target, FRAME, 0)
      const twice = chaseStory(chaseStory(current, target, FRAME / 2, 0), target, FRAME / 2, 0)
      expect(twice).toBeCloseTo(once, 9)
    }
  })
})
