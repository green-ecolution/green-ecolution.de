import { describe, expect, it } from 'vitest'
import { moisture, thirst } from '../lib/dryness'
import { kerb, roadWidth } from './streamletTour'
import {
  DEPOT_ARC,
  DEPOT_SITE,
  HYDRANT_SITE,
  START_DAYS,
  TANK_CAPACITY,
  antenna,
  blocks,
  depot,
  hydrant,
  looseTrees,
  plate,
  roads,
  siteOfTree,
  sitePoints,
  streets,
  townGraph,
  townTrees,
  treeOfSite,
} from './productTown'

const CLEAR = roadWidth / 2 + kerb.width

/** Distance from a point to the nearest carriageway's centre line. */
function offRoad([x, z]: readonly [number, number]): number {
  return Math.min(
    ...roads.map(({ from, to }) => {
      const dx = Math.max(Math.min(from[0], to[0]) - x, 0, x - Math.max(from[0], to[0]))
      const dz = Math.max(Math.min(from[1], to[1]) - z, 0, z - Math.max(from[1], to[1]))
      return Math.hypot(dx, dz)
    }),
  )
}

function thirstyAt(days: number): number[] {
  return townTrees
    .map((tree, index) => ({ index, state: thirst(moisture(tree.rate, days)) }))
    .filter((tree) => tree.state === 'dry')
    .map((tree) => siteOfTree(tree.index))
}

describe('productTown', () => {
  it('hat zwölf Bäume mit eigenen Namen und Raten', () => {
    expect(townTrees).toHaveLength(12)
    expect(new Set(townTrees.map((tree) => tree.id)).size).toBe(12)
    expect(new Set(townTrees.map((tree) => tree.rate)).size).toBe(12)
  })

  it('ordnet Bäume und Halte einander zu', () => {
    townTrees.forEach((tree, index) => {
      expect(sitePoints[siteOfTree(index)]).toEqual(tree.stop)
      expect(treeOfSite(siteOfTree(index))).toBe(index)
    })
    expect(sitePoints[DEPOT_SITE]).toEqual(depot.stop)
    expect(sitePoints[HYDRANT_SITE]).toEqual(hydrant.stop)
    expect(treeOfSite(DEPOT_SITE)).toBe(-1)
  })

  it('erreicht jeden Halt von jeder Ankunft an jedem anderen', () => {
    sitePoints.forEach((_, from) => {
      for (const arc of townGraph.arrivals(from)) {
        sitePoints.forEach((_, to) => {
          const ways = townGraph.arrivals(to).map((into) => townGraph.distance(arc, into))
          expect(ways.some(Number.isFinite)).toBe(true)
        })
      }
    })
  })

  it('kommt am Bauhof nur aus einer Richtung an, an jedem anderen Halt aus zweien', () => {
    expect(townGraph.arrivals(DEPOT_SITE)).toEqual([DEPOT_ARC])
    sitePoints.forEach((_, site) => {
      if (site !== DEPOT_SITE) expect(townGraph.arrivals(site)).toHaveLength(2)
    })
  })

  it('zeichnet unter jeder Fahrstrecke eine Straße', () => {
    for (const street of streets) {
      for (const share of [0, 0.25, 0.5, 0.75, 1]) {
        const point = [
          street.from[0] + (street.to[0] - street.from[0]) * share,
          street.from[1] + (street.to[1] - street.from[1]) * share,
        ] as const
        expect(offRoad(point)).toBeLessThanOrEqual(roadWidth / 2)
      }
    }
  })

  it('hält Bäume und Häuser von der Fahrbahn fern und auf der Platte', () => {
    for (const tree of [...townTrees, ...looseTrees]) {
      expect(offRoad(tree.at)).toBeGreaterThan(CLEAR + 2)
      expect(Math.abs(tree.at[0])).toBeLessThan(plate.width / 2 - 2)
      expect(Math.abs(tree.at[1])).toBeLessThan(plate.depth / 2 - 2)
    }
    for (const block of blocks) {
      const corners = [
        [block.x - block.width / 2, block.z - block.depth / 2],
        [block.x + block.width / 2, block.z - block.depth / 2],
        [block.x - block.width / 2, block.z + block.depth / 2],
        [block.x + block.width / 2, block.z + block.depth / 2],
      ] as const
      for (const corner of corners) {
        expect(offRoad(corner)).toBeGreaterThan(CLEAR)
        expect(Math.abs(corner[0])).toBeLessThanOrEqual(plate.width / 2 - 1)
        expect(Math.abs(corner[1])).toBeLessThanOrEqual(plate.depth / 2 - 1)
      }
    }
  })

  it('stellt kein Haus in einen Baum', () => {
    for (const tree of [...townTrees, ...looseTrees]) {
      for (const block of blocks) {
        const dx = Math.max(Math.abs(tree.at[0] - block.x) - block.width / 2, 0)
        const dz = Math.max(Math.abs(tree.at[1] - block.z) - block.depth / 2, 0)
        expect(Math.hypot(dx, dz)).toBeGreaterThan(tree.canopyRadius)
      }
    }
  })

  it('braucht in der Ausgangsstellung mehr Wasser, als ein Tank fasst', () => {
    expect(thirstyAt(START_DAYS).length).toBeGreaterThan(TANK_CAPACITY)
  })

  it('schickt nach frischem Regen niemanden los', () => {
    expect(thirstyAt(0)).toEqual([])
  })
})

describe('Antenne', () => {
  it('steht auf einem Flachdach', () => {
    const roof = blocks.find((block) => block.x === antenna.at[0] && block.z === antenna.at[1])
    expect(roof?.roof).toBe('flat')
    expect(antenna.base).toBe(roof?.height)
  })
})
