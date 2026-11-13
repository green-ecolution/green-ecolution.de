import { describe, expect, it } from 'vitest'
import {
  crossedRing,
  grabString,
  ringGive,
  ringPath,
  ringPointCount,
  ringPoints,
  stepString,
} from './growthRings'

const CENTRE = 200
const SHAPE = { tension: 3000, stiffness: 400, damping: 3.2 }

function still(count: number) {
  return { offset: new Float32Array(count), speed: new Float32Array(count) }
}

function simulate(string: ReturnType<typeof still>, seconds: number) {
  for (let step = 0; step < seconds * 120; step++) stepString(string, 1 / 120, SHAPE)
}

describe('ringPoints', () => {
  it('legt die Punkte ohne Auslenkung auf einen Kreis', () => {
    for (const point of ringPoints(90, new Float32Array(24), 0)) {
      expect(Math.hypot(point.x - CENTRE, point.y - CENTRE)).toBeCloseTo(90)
    }
  })

  it('beginnt beim angegebenen Winkel', () => {
    const [first] = ringPoints(90, new Float32Array(24), 90)
    expect(first.x).toBeCloseTo(CENTRE)
    expect(first.y).toBeCloseTo(CENTRE + 90)
  })

  it('schiebt einen ausgelenkten Punkt entlang seines Radius', () => {
    const offsets = new Float32Array(24)
    offsets[0] = 12
    const [first] = ringPoints(90, offsets, 0)
    expect(first.x).toBeCloseTo(CENTRE + 102)
    expect(first.y).toBeCloseTo(CENTRE)
  })
})

describe('ringPath', () => {
  it('zeichnet eine geschlossene Kurve mit einem Bogen je Punkt', () => {
    const path = ringPath(90, new Float32Array(24), 0)
    expect(path.startsWith('M')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
    expect(path.match(/Q/g)).toHaveLength(24)
  })
})

describe('grabString', () => {
  it('zieht die Saite an der Stelle des Zeigers ganz mit', () => {
    const string = still(96)
    grabString(string, 0, 10, 90, 0)
    expect(string.offset[0]).toBeCloseTo(10)
  })

  it('zieht die Nachbarn schwächer mit und lässt die Gegenseite in Ruhe', () => {
    const string = still(96)
    grabString(string, 0, 10, 90, 0)
    expect(string.offset[2]).toBeGreaterThan(0)
    expect(string.offset[2]).toBeLessThan(string.offset[0])
    expect(string.offset[48]).toBeCloseTo(0)
  })

  it('greift dort, wo der Zeiger steht, auch wenn der Ring gedreht beginnt', () => {
    const string = still(96)
    grabString(string, Math.PI / 2, 10, 90, 90)
    expect(string.offset[0]).toBeCloseTo(10)
  })
})

describe('grabString auf kleinen und großen Ringen', () => {
  it('greift einen kleinen Ring schmaler als einen großen', () => {
    const small = still(ringPointCount(30))
    const large = still(ringPointCount(180))
    grabString(small, 0, 10, 30, 0)
    grabString(large, 0, 10, 180, 0)
    expect(small.offset[1]).toBeLessThan(large.offset[1] - 1)
  })
})

describe('ringGive', () => {
  it('lässt den äußersten Ring ganz nachgeben', () => {
    expect(ringGive(180, 180)).toBe(1)
  })

  it('macht kleinere Ringe steifer, ohne sie starr zu machen', () => {
    expect(ringGive(30, 180)).toBeLessThan(0.4)
    expect(ringGive(30, 180)).toBeGreaterThan(0.15)
    expect(ringGive(90, 180)).toBeGreaterThan(ringGive(30, 180))
    expect(ringGive(90, 180)).toBeLessThan(1)
  })
})

describe('stepString', () => {
  it('bleibt in Ruhe, wenn nichts ausgelenkt ist', () => {
    const string = still(96)
    simulate(string, 1)
    expect(Math.max(...string.offset.map(Math.abs))).toBe(0)
  })

  it('schwingt nach dem Loslassen über die Ruhelage hinaus', () => {
    const string = still(96)
    grabString(string, 0, 10, 90, 0)
    let lowest = 0
    for (let step = 0; step < 120; step++) {
      stepString(string, 1 / 120, SHAPE)
      lowest = Math.min(lowest, string.offset[0])
    }
    expect(lowest).toBeLessThan(-1)
  })

  it('gibt die Auslenkung an die Nachbarn weiter', () => {
    const string = still(96)
    string.offset[0] = 10
    simulate(string, 0.1)
    expect(Math.abs(string.offset[3])).toBeGreaterThan(0.01)
  })

  it('kommt wieder zur Ruhe', () => {
    const string = still(96)
    grabString(string, 0, 10, 90, 0)
    simulate(string, 6)
    expect(Math.max(...string.offset.map(Math.abs))).toBeLessThan(0.01)
  })
})

describe('crossedRing', () => {
  it('erkennt, dass der Zeiger zwischen zwei Bildern über den Ring gesprungen ist', () => {
    expect(crossedRing(70, 110, 90)).toBe(true)
    expect(crossedRing(110, 70, 90)).toBe(true)
  })

  it('bleibt still, solange der Zeiger auf einer Seite bleibt', () => {
    expect(crossedRing(70, 85, 90)).toBe(false)
    expect(crossedRing(95, 140, 90)).toBe(false)
  })
})

describe('ringPointCount', () => {
  it('gibt größeren Ringen mehr Punkte, damit sie gleich fein bleiben', () => {
    expect(ringPointCount(180)).toBeGreaterThan(ringPointCount(30) * 5)
  })
})
