import { describe, expect, it } from 'vitest'
import { roadGraph, type RoadGraph, type Street } from './roadGraph'
import type { GroundPoint } from './storyPath'

// Two parallel streets with three cross streets and a dead end:
//   (0,0) ---- (10,0) ---- (20,0)
//     |          |           |
//   (0,10) --- (10,10) --- (20,10)
//                |
//             (10,16)
const streets: Street[] = [
  { from: [0, 0], to: [20, 0] },
  { from: [0, 10], to: [20, 10] },
  { from: [0, 0], to: [0, 10] },
  { from: [10, 0], to: [10, 10] },
  { from: [20, 0], to: [20, 10] },
  { from: [10, 10], to: [10, 16] },
]

/** The arc that ends at `site` coming from the side of `from`. */
function arriving(graph: RoadGraph, site: number, from: GroundPoint): number {
  const arc = graph.arrivals(site).find((candidate) => {
    const [start] = graph.arcEnds(candidate)
    return start[0] === from[0] && start[1] === from[1]
  })
  if (arc === undefined) throw new Error(`no arc into ${site} from ${from.join()}`)
  return arc
}

describe('roadGraph', () => {
  const graph = roadGraph(streets, [
    [2, 0],
    [8, 0],
    [10, 16],
    [12, 10],
  ])
  const eastAtA = arriving(graph, 0, [0, 0])
  const eastAtB = arriving(graph, 1, [2, 0])

  it('kommt mitten an einer Straße aus zwei Richtungen an, in einer Sackgasse aus einer', () => {
    expect(graph.arrivals(0)).toHaveLength(2)
    expect(graph.arrivals(2)).toHaveLength(1)
  })

  it('misst zwei Halte an derselben Straße in Fahrtrichtung auf direktem Weg', () => {
    expect(graph.distance(eastAtA, eastAtB)).toBeCloseTo(6)
    expect(graph.path(eastAtA, eastAtB)).toEqual([
      [2, 0],
      [8, 0],
    ])
  })

  it('wendet nicht an einem Halt: zum Halt dahinter geht es um den Block', () => {
    expect(graph.distance(eastAtB, eastAtA)).toBeCloseTo(34)
    expect(graph.path(eastAtB, eastAtA)).toEqual([
      [8, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
      [2, 0],
    ])
  })

  it('misst hin und zurück verschieden weit', () => {
    expect(graph.distance(eastAtA, eastAtB)).not.toBeCloseTo(graph.distance(eastAtB, eastAtA))
  })

  it('kehrt für die Gegenrichtung in der Sackgasse um und behält diese Wende im Weg', () => {
    const westAtA = arriving(graph, 0, [8, 0])
    expect(graph.distance(eastAtB, westAtA)).toBeCloseTo(42)
    expect(graph.path(eastAtB, westAtA)).toEqual([
      [8, 0],
      [10, 0],
      [10, 16],
      [10, 0],
      [2, 0],
    ])
  })

  it('wendet in der Sackgasse', () => {
    const [deadEnd] = graph.arrivals(2)
    const eastAtD = arriving(graph, 3, [10, 10])
    expect(graph.distance(deadEnd, eastAtD)).toBeCloseTo(8)
    expect(graph.path(deadEnd, eastAtD)).toEqual([
      [10, 16],
      [10, 10],
      [12, 10],
    ])
  })

  it('nutzt die Querstraße, die mitten auf eine andere Straße trifft', () => {
    const cross = roadGraph(streets, [
      [9, 0],
      [9, 10],
    ])
    const from = arriving(cross, 0, [0, 0])
    const to = arriving(cross, 1, [10, 10])
    expect(cross.distance(from, to)).toBeCloseTo(12)
    expect(cross.path(from, to)).toEqual([
      [9, 0],
      [10, 0],
      [10, 10],
      [9, 10],
    ])
  })

  it('nennt im Weg nur die Ecken', () => {
    const along = roadGraph(streets, [
      [2, 0],
      [18, 0],
    ])
    // The junction at (10, 0) lies on the way but is no corner.
    expect(along.path(arriving(along, 0, [0, 0]), arriving(along, 1, [10, 0]))).toEqual([
      [2, 0],
      [18, 0],
    ])
  })

  it('führt von einem Halt zu sich selbst über keine Strecke', () => {
    expect(graph.distance(eastAtA, eastAtA)).toBe(0)
    expect(graph.path(eastAtA, eastAtA)).toEqual([[2, 0]])
  })

  it('lehnt einen Halt ab, der an keiner Straße liegt', () => {
    expect(() => roadGraph(streets, [[5, 5]])).toThrow(/not on a street/)
  })
})
