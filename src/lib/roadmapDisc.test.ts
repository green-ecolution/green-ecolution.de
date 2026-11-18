import { describe, expect, it } from 'vitest'
import { DISC_SIZE, PITH, leaderLine, ringOutline, ringPoint } from './roadmapDisc'

const BOUNDS = [52, 96, 136, 173, 206]
const ANGLES = Array.from({ length: 72 }, (_, index) => (index / 72) * 2 * Math.PI)

describe('ringPoint', () => {
  it('legt jeden Ring an jeder Stelle außen um den vorigen', () => {
    for (const angle of ANGLES) {
      const reaches = BOUNDS.map((radius) => {
        const point = ringPoint(radius, angle)
        return Math.hypot(point.x - PITH.x, point.y - PITH.y)
      })
      expect(reaches).toEqual([...reaches].sort((a, b) => a - b))
    }
  })

  it('hält den äußersten Ring in der Zeichenfläche', () => {
    for (const angle of ANGLES) {
      const point = ringPoint(BOUNDS.at(-1)!, angle)
      expect(Math.min(point.x, point.y)).toBeGreaterThan(1)
      expect(Math.max(point.x, point.y)).toBeLessThan(DISC_SIZE - 1)
    }
  })
})

describe('ringOutline', () => {
  it('zeichnet eine geschlossene Kurve', () => {
    const outline = ringOutline(96)
    expect(outline.startsWith('M')).toBe(true)
    expect(outline.endsWith('Z')).toBe(true)
  })
})

describe('leaderLine', () => {
  it('läuft gerade hinaus, wo das Band die Zeile kreuzt', () => {
    const { start, path } = leaderLine(96, 136, 150, 474)
    expect(start.y).toBeCloseTo(150, 0)
    expect(path).not.toContain('L')
    expect(path.endsWith('H474')).toBe(true)
  })

  it('beginnt mitten im Band', () => {
    const { start } = leaderLine(96, 136, 150, 474)
    const reach = Math.hypot(start.x - PITH.x, start.y - PITH.y)
    expect(reach).toBeGreaterThan(100)
    expect(reach).toBeLessThan(132)
  })

  it('knickt zur Zeile ab, wenn das Band sie nicht erreicht', () => {
    const { start, path } = leaderLine(52, 96, 10, 474)
    expect(start.x).toBeGreaterThan(PITH.x)
    expect(path).toMatch(/L[\d.]+ 10H474$/)
  })
})
