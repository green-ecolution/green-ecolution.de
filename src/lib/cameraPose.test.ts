import { describe, expect, it } from 'vitest'
import {
  blendPoses,
  geometric,
  matchedPose,
  projected,
  type CameraPose,
  type Vec3,
} from './cameraPose'

const length = (v: Vec3) => Math.hypot(v[0], v[1], v[2])
const offset = (pose: CameraPose): Vec3 => [
  pose.position[0] - pose.target[0],
  pose.position[1] - pose.target[1],
  pose.position[2] - pose.target[2],
]

// Far above the town with a narrow lens, and low behind the truck with a wide one.
const high = matchedPose([4, 1.5, -2], [1, 1, 1], 62, 1)
const seat: CameraPose = { position: [-36, 5.65, 20], target: [-36, 4.2, 8], fov: 52 }

describe('matchedPose', () => {
  it('steht in Blickrichtung so weit weg, dass das Bild die verlangte Höhe zeigt', () => {
    const away = offset(high)
    const distance = length(away)
    expect(2 * distance * Math.tan((high.fov * Math.PI) / 360)).toBeCloseTo(62)
    expect(away[0] / distance).toBeCloseTo(1 / Math.sqrt(3))
    expect(away[1] / distance).toBeCloseTo(1 / Math.sqrt(3))
  })
})

describe('blendPoses', () => {
  it('liefert an den Enden die beiden Posen', () => {
    for (const [share, pose] of [
      [0, high],
      [1, seat],
    ] as const) {
      const blended = blendPoses(high, seat, share)
      blended.position.forEach((value, axis) => expect(value).toBeCloseTo(pose.position[axis], 6))
      blended.target.forEach((value, axis) => expect(value).toBeCloseTo(pose.target[axis], 6))
      expect(blended.fov).toBeCloseTo(pose.fov, 6)
    }
  })

  it('kommt mit stetig abnehmendem Abstand näher', () => {
    let before = Infinity
    for (let step = 0; step <= 50; step++) {
      const distance = length(offset(blendPoses(high, seat, step / 50)))
      expect(distance).toBeLessThan(before)
      before = distance
    }
  })

  it('dreht die Blickrichtung, ohne sie zu verkürzen', () => {
    const start = offset(high)
    const end = offset(seat)
    const startLength = length(start)
    const endLength = length(end)
    for (let step = 0; step <= 20; step++) {
      const share = step / 20
      const away = offset(blendPoses(high, seat, share))
      const distance = length(away)
      expect(distance).toBeCloseTo(geometric(startLength, endLength, share), 6)
      const direction = away.map((value) => value / distance)
      expect(Math.hypot(...direction)).toBeCloseTo(1, 9)
    }
  })

  it('weitet das Objektiv gleichmäßig im Verhältnis', () => {
    const middle = blendPoses(high, seat, 0.5)
    const tan = (fov: number) => Math.tan((fov * Math.PI) / 360)
    expect(tan(middle.fov)).toBeCloseTo(Math.sqrt(tan(high.fov) * tan(seat.fov)), 9)
  })

  it('verträgt zwei gleiche Richtungen', () => {
    const near = { ...high, position: [5, 2.5, -1] as Vec3 }
    const blended = blendPoses(high, near, 0.5)
    blended.position.forEach((value) => expect(Number.isFinite(value)).toBe(true))
  })
})

describe('Objektivverschiebung', () => {
  const ahead: CameraPose = { position: [0, 0, 10], target: [0, 0, 0], fov: 90 }

  it('bildet das Ziel in die Bildmitte ab, solange nichts verschoben ist', () => {
    expect(projected(ahead, 1.5, [0, 0, 0])).toEqual([0, 0])
  })

  it('bildet Punkte rechts und oben rechts und oben ab', () => {
    const [x, y] = projected(ahead, 2, [5, 5, 5]) ?? [0, 0]
    // tan(45°) = 1 at half the picture's height: 5 / 5 up, 5 / 5 / 2 across.
    expect(x).toBeCloseTo(0.5)
    expect(y).toBeCloseTo(1)
  })

  it('schiebt das Bild, ohne die Kamera zu drehen', () => {
    const shifted: CameraPose = { ...ahead, shift: [0.5, -0.25] }
    const [x, y] = projected(shifted, 1, [0, 0, 0]) ?? [1, 1]
    expect(x).toBeCloseTo(-0.5)
    expect(y).toBeCloseTo(0.25)
  })

  it('gibt für Punkte hinter der Kamera nichts zurück', () => {
    expect(projected(ahead, 1, [0, 0, 20])).toBeNull()
  })

  it('mischt die Verschiebung gleichmäßig und lässt sie an den Enden stehen', () => {
    const a: CameraPose = { ...seat, shift: [0.4, 0.2] }
    expect(blendPoses(a, high, 0).shift).toEqual([0.4, 0.2])
    expect(blendPoses(a, high, 1).shift).toEqual([0, 0])
    const middle = blendPoses(a, high, 0.5).shift ?? [0, 0]
    expect(middle[0]).toBeCloseTo(0.2)
    expect(middle[1]).toBeCloseTo(0.1)
  })
})

describe('geometric', () => {
  it('mischt im Verhältnis', () => {
    expect(geometric(1, 100, 0.5)).toBeCloseTo(10)
    expect(geometric(28, 1e5, 0)).toBe(28)
    expect(geometric(28, 1e5, 1)).toBeCloseTo(1e5)
  })
})
