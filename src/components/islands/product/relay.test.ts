import { describe, expect, it } from 'vitest'
import { townTrees } from '../../../data/productTown'
import { PROBE_TOP, probeAt } from './probe'
import { GATEWAY_TIP, DEPOT_ROOF, relayDot } from './relay'

const tree = townTrees[0]

function expectAt(at: readonly number[], place: readonly number[]) {
  at.forEach((value, axis) => expect(value).toBeCloseTo(place[axis]))
}

describe('relayDot', () => {
  it('wächst über der Sonde und kommt in voller Größe am Gateway an', () => {
    const [x, z] = probeAt(tree)
    expectAt(relayDot(tree, 'up', 0).at, [x, PROBE_TOP + 0.5, z])
    expect(relayDot(tree, 'up', 0).size).toBe(0)
    expect(relayDot(tree, 'up', 0.5).size).toBe(1)
    expectAt(relayDot(tree, 'up', 1).at, GATEWAY_TIP)
    expect(relayDot(tree, 'up', 1).size).toBe(1)
  })

  it('fliegt vom Gateway zum Bauhof und geht dort auf', () => {
    expectAt(relayDot(tree, 'over', 0).at, GATEWAY_TIP)
    expect(relayDot(tree, 'over', 0).size).toBe(1)
    expect(relayDot(tree, 'over', 0.7).size).toBe(1)
    expectAt(relayDot(tree, 'over', 1).at, DEPOT_ROOF)
    expect(relayDot(tree, 'over', 1).size).toBe(0)
  })

  it('fliegt beide Wege im Bogen über der geraden Linie', () => {
    const [, up] = relayDot(tree, 'up', 0.5).at
    const [, over] = relayDot(tree, 'over', 0.5).at
    expect(up).toBeGreaterThan((PROBE_TOP + GATEWAY_TIP[1]) / 2 + 4)
    expect(over).toBeGreaterThan((GATEWAY_TIP[1] + DEPOT_ROOF[1]) / 2 + 6)
  })
})
