import { describe, expect, it } from 'vitest'
import {
  fractionNear,
  pathLength,
  pointAlong,
  roundedPath,
  vehiclePose,
  type GroundPoint,
} from './storyPath'

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

describe('vehiclePose', () => {
  const wheelbase = 4
  const samples = Array.from({ length: 101 }, (_, index) => index / 100)

  it('schaut auf einer Geraden überall in ihre Richtung, auch an den Enden', () => {
    const diagonal: GroundPoint[] = [
      [0, 0],
      [10, 10],
      [20, 20],
    ]
    for (const t of samples) {
      const pose = vehiclePose(diagonal, t, wheelbase)
      expect(pose.heading).toBeCloseTo(Math.PI / 4)
      expect(pose.at[0]).toBeCloseTo(pointAlong(diagonal, t).at[0])
      expect(pose.at[1]).toBeCloseTo(pointAlong(diagonal, t).at[1])
    }
  })

  it('biegt erst ab, wenn die Vorderachse die Ecke erreicht, und nur in eine Richtung', () => {
    // The corner lies at half the length, 20 in all; the axles are 2 either side.
    for (const t of samples.filter((t) => t <= 0.4)) {
      expect(vehiclePose(corner, t, wheelbase).heading).toBeCloseTo(0)
    }
    for (const t of samples.filter((t) => t >= 0.6)) {
      expect(vehiclePose(corner, t, wheelbase).heading).toBeCloseTo(Math.PI / 2)
    }
    const turning = samples
      .filter((t) => t > 0.4 && t < 0.6)
      .map((t) => vehiclePose(corner, t, wheelbase).heading)
    turning.slice(1).forEach((heading, index) => {
      expect(heading).toBeGreaterThan(turning[index])
    })
  })

  it('hängt nur von Weg, Stelle und Radstand ab', () => {
    const path = roundedPath(corner, 3)
    const forwards = samples.map((t) => vehiclePose(path, t, wheelbase))
    const backwards = [...samples].reverse().map((t) => vehiclePose(path, t, wheelbase))
    const jumping = samples.map((_, index) =>
      vehiclePose(path, samples[(index * 37) % samples.length], wheelbase),
    )
    expect(backwards.reverse()).toEqual(forwards)
    samples.forEach((_, index) => {
      expect(jumping[index]).toEqual(forwards[(index * 37) % samples.length])
    })
  })

  it('steht nie weiter als einen halben Radstand neben dem Weg', () => {
    for (const path of [corner, roundedPath(corner, 3)]) {
      for (const t of samples) {
        const { at } = vehiclePose(path, t, wheelbase)
        const nearest = pointAlong(path, fractionNear(path, at)).at
        expect(Math.hypot(at[0] - nearest[0], at[1] - nearest[1])).toBeLessThanOrEqual(
          wheelbase / 2,
        )
      }
    }
  })
})

describe('fractionNear', () => {
  it('findet die Stelle des Wegs, die einem Punkt am nächsten liegt', () => {
    expect(fractionNear(corner, [3, 5])).toBeCloseTo(0.25)
    expect(fractionNear(corner, [5, 13])).toBeCloseTo(0.75)
  })
})
