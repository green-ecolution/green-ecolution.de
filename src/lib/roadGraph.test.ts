import { describe, expect, it } from 'vitest'
import { roadGraph, type Street } from './roadGraph'

// Two parallel streets with three cross streets:
//   (0,0) ---- (10,0) ---- (20,0)
//     |          |           |
//   (0,10) --- (10,10) --- (20,10)
const streets: Street[] = [
  { from: [0, 0], to: [20, 0] },
  { from: [0, 10], to: [20, 10] },
  { from: [0, 0], to: [0, 10] },
  { from: [10, 0], to: [10, 10] },
  { from: [20, 0], to: [20, 10] },
]

describe('roadGraph', () => {
  it('misst zwei Halte an derselben Straße auf direktem Weg', () => {
    const graph = roadGraph(streets, [
      [2, 0],
      [8, 0],
    ])
    expect(graph.distance(0, 1)).toBeCloseTo(6)
    expect(graph.distance(1, 0)).toBeCloseTo(6)
  })

  it('nimmt den kürzeren Weg um den Block', () => {
    const graph = roadGraph(streets, [
      [2, 0],
      [2, 10],
    ])
    expect(graph.distance(0, 1)).toBeCloseTo(14)
  })

  it('nutzt die Querstraße, die mitten auf eine andere Straße trifft', () => {
    const graph = roadGraph(streets, [
      [9, 0],
      [9, 10],
    ])
    expect(graph.distance(0, 1)).toBeCloseTo(12)
    expect(graph.path(0, 1)).toEqual([
      [9, 0],
      [10, 0],
      [10, 10],
      [9, 10],
    ])
  })

  it('nennt im Weg nur die Ecken', () => {
    const graph = roadGraph(streets, [
      [2, 0],
      [18, 0],
      [2, 10],
    ])
    // The junction at (10, 0) lies on the way but is no corner.
    expect(graph.path(0, 1)).toEqual([
      [2, 0],
      [18, 0],
    ])
    expect(graph.path(0, 2)).toEqual([
      [2, 0],
      [0, 0],
      [0, 10],
      [2, 10],
    ])
  })

  it('führt von einem Halt zu sich selbst über keine Strecke', () => {
    const graph = roadGraph(streets, [[5, 0]])
    expect(graph.distance(0, 0)).toBe(0)
    expect(graph.path(0, 0)).toEqual([[5, 0]])
  })

  it('lehnt einen Halt ab, der an keiner Straße liegt', () => {
    expect(() => roadGraph(streets, [[5, 5]])).toThrow(/not on a street/)
  })
})
