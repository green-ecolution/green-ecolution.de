import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { jetGeometry, jetPoint, jetRadius, jetSpan, shapeJet, type JetArc } from './waterJet'

const arc: JetArc = { from: new Vector3(2, 4, 1), to: new Vector3(-3, 0.3, 5), rise: 0.7 }

describe('jetSpan', () => {
  it('ist vor und nach dem Gießen leer', () => {
    expect(jetSpan(0)).toEqual({ tail: 0, head: 0 })
    expect(jetSpan(1)).toEqual({ tail: 1, head: 1 })
  })

  it('reicht in der Mitte von der Düse bis zum Boden', () => {
    expect(jetSpan(0.5)).toEqual({ tail: 0, head: 1 })
  })

  it('schießt erst heraus und reißt am Ende an der Düse ab', () => {
    let previous = jetSpan(0)
    for (let step = 1; step <= 100; step++) {
      const next = jetSpan(step / 100)
      expect(next.head).toBeGreaterThanOrEqual(previous.head)
      expect(next.tail).toBeGreaterThanOrEqual(previous.tail)
      expect(next.tail).toBeLessThanOrEqual(next.head)
      previous = next
    }
    expect(jetSpan(0.05).head).toBeGreaterThan(0)
    expect(jetSpan(0.05).head).toBeLessThan(1)
    expect(jetSpan(0.95).tail).toBeGreaterThan(0)
    expect(jetSpan(0.95).tail).toBeLessThan(1)
  })
})

describe('jetPoint', () => {
  const at = (share: number) => jetPoint(arc, share, new Vector3())

  it('beginnt an der Düse und landet im Ziel', () => {
    expect(at(0).distanceTo(arc.from)).toBeCloseTo(0)
    expect(at(1).distanceTo(arc.to)).toBeCloseTo(0)
  })

  it('steigt um die Wurfhöhe über die Düse und fällt danach nur noch', () => {
    let highest = -Infinity
    let highestAt = 0
    for (let step = 0; step <= 200; step++) {
      const y = at(step / 200).y
      if (y > highest) {
        highest = y
        highestAt = step / 200
      }
    }
    expect(highest - arc.from.y).toBeCloseTo(arc.rise, 2)
    expect(highestAt).toBeGreaterThan(0)
    expect(highestAt).toBeLessThan(0.5)
    for (let step = Math.ceil(highestAt * 200) + 1; step <= 200; step++) {
      expect(at(step / 200).y).toBeLessThan(at((step - 1) / 200).y)
    }
  })

  it('kommt waagerecht gleichmäßig voran', () => {
    const half = at(0.5)
    expect(half.x).toBeCloseTo((arc.from.x + arc.to.x) / 2)
    expect(half.z).toBeCloseTo((arc.from.z + arc.to.z) / 2)
  })
})

describe('shapeJet', () => {
  const bounds = (tail: number, head: number) => {
    const geometry = jetGeometry()
    shapeJet(geometry, arc, tail, head, 0)
    geometry.computeBoundingBox()
    return geometry.boundingBox!
  }

  it('füllt nur die Strecke, auf der Wasser unterwegs ist', () => {
    const full = bounds(0, 1)
    const started = bounds(0, 0.3)
    const ending = bounds(0.7, 1)

    expect(full.max.x).toBeGreaterThan(arc.from.x - 0.5)
    expect(full.min.x).toBeLessThan(arc.to.x + 0.5)
    expect(started.min.x).toBeGreaterThan(jetPoint(arc, 0.3, new Vector3()).x - 0.5)
    expect(ending.max.x).toBeLessThan(jetPoint(arc, 0.7, new Vector3()).x + 0.5)
  })

  it('schließt ein freies Ende zu einer Spitze', () => {
    const geometry = jetGeometry()
    shapeJet(geometry, arc, 0, 0.5, 0)
    const position = geometry.getAttribute('position')
    const tip = jetPoint(arc, 0.5, new Vector3())
    const lastVertex = new Vector3().fromBufferAttribute(position, position.count - 3)
    expect(lastVertex.distanceTo(tip)).toBeCloseTo(0)
  })
})

describe('jetRadius', () => {
  it('wird zum Auftreffpunkt hin breiter', () => {
    for (let step = 1; step <= 20; step++) {
      expect(jetRadius(step / 20)).toBeGreaterThan(jetRadius((step - 1) / 20))
    }
    expect(jetRadius(1)).toBeGreaterThan(jetRadius(0) * 2)
  })
})
