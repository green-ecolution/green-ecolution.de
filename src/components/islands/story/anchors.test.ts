import { describe, expect, it } from 'vitest'
import { progressAt, storyState } from '../../../lib/storyTimeline'
import { heroLabel } from './anchors'

describe('heroLabel', () => {
  it('steht, solange der Punkt unseres Baums rot ist', () => {
    expect(heroLabel.shown(storyState(progressAt(1, 0.5)))).toBe(false)
    expect(heroLabel.shown(storyState(progressAt(1, 0.9)))).toBe(true)
    // Watered, but not yet recovered: the pin is still red.
    const watered = storyState(progressAt(2, 0.85))
    expect(watered.health).toBeLessThanOrEqual(0.5)
    expect(heroLabel.shown(watered)).toBe(true)
    const recovered = storyState(progressAt(2, 0.95))
    expect(recovered.health).toBeGreaterThan(0.5)
    expect(heroLabel.shown(recovered)).toBe(false)
  })
})
