import { describe, expect, it } from 'vitest'
import { fractionNear, pathLength, pointAlong, roundedPath, type GroundPoint } from './storyPath'

const corner: GroundPoint[] = [
  [0, 0],
  [0, 10],
  [10, 10],
]

describe('roundedPath', () => {
  it('behält Anfang und Ende und schneidet die Ecke ab', () => {
    const path = roundedPath(corner, 2)
    expect(path[0]).toEqual([0, 0])
    expect(path[path.length - 1]).toEqual([10, 10])
    expect(path).toContainEqual([0, 8])
    expect(path).toContainEqual([2, 10])
    expect(path).not.toContainEqual([0, 10])
  })

  it('rundet nie weiter als bis zur Mitte eines Stücks', () => {
    const path = roundedPath(corner, 50)
    expect(path).toContainEqual([0, 5])
    expect(path).toContainEqual([5, 10])
  })

  it('lässt einen Weg ohne Ecke unverändert', () => {
    expect(
      roundedPath(
        [
          [0, 0],
          [4, 0],
        ],
        2,
      ),
    ).toEqual([
      [0, 0],
      [4, 0],
    ])
  })
})

describe('pathLength', () => {
  it('summiert die Stücke', () => {
    expect(pathLength(corner)).toBe(20)
  })
})

describe('pointAlong', () => {
  it('liefert Ort und Fahrtrichtung', () => {
    expect(pointAlong(corner, 0.25)).toEqual({ at: [0, 5], heading: 0 })
    const second = pointAlong(corner, 0.75)
    expect(second.at).toEqual([5, 10])
    expect(second.heading).toBeCloseTo(Math.PI / 2)
  })

  it('bleibt an den Enden stehen', () => {
    expect(pointAlong(corner, -1).at).toEqual([0, 0])
    expect(pointAlong(corner, 2).at).toEqual([10, 10])
  })
})

describe('fractionNear', () => {
  it('findet die Stelle des Wegs, die einem Punkt am nächsten liegt', () => {
    expect(fractionNear(corner, [3, 5])).toBeCloseTo(0.25)
    expect(fractionNear(corner, [5, 13])).toBeCloseTo(0.75)
  })
})
