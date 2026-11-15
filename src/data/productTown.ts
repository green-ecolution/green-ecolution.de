import { roadGraph, type Street } from '../lib/roadGraph'
import type { GroundPoint } from '../lib/storyPath'
import type { Road } from './storyTown'
import { roadWidth, type CityBlock, type Lawn, type Tree } from './streamletTour'

// Ground coordinates are [x, z]. The camera looks down from +x and +z, so
// larger sums of the two are nearer to the viewer.
export const plate = { width: 120, depth: 84, radius: 4, thickness: 1.2 } as const

const HALF_ROAD = roadWidth / 2
const WEST = -36
const EAST = 36
const NORTH = -22
const SOUTH = 22
const CROSS = 4
const EDGE_X = plate.width / 2
const EDGE_Z = plate.depth / 2

export const depot = {
  /** Centre of the hall; its gate faces +x, towards the road. */
  at: [-46.5, 33] as GroundPoint,
  stop: [WEST, 33] as GroundPoint,
}

export const hydrant = {
  at: [42, -16] as GroundPoint,
  stop: [EAST, -16] as GroundPoint,
}

// What the vehicle drives on: centre lines that meet at their end points.
export const streets: Street[] = [
  { from: [WEST, NORTH], to: [EAST, NORTH] },
  { from: [WEST, SOUTH], to: [EAST, SOUTH] },
  { from: [WEST, NORTH], to: [WEST, SOUTH] },
  { from: [EAST, NORTH], to: [EAST, SOUTH] },
  { from: [CROSS, NORTH], to: [CROSS, SOUTH] },
  { from: [WEST, SOUTH], to: depot.stop },
]

// What is drawn. The two long sides of the ring carry the corners, every other
// road stops where their carriageway begins, so no two surfaces share a plane.
export const roads: Road[] = [
  { from: [WEST - HALF_ROAD, NORTH], to: [EDGE_X, NORTH] },
  { from: [WEST - HALF_ROAD, SOUTH], to: [EAST + HALF_ROAD, SOUTH] },
  { from: [WEST, NORTH + HALF_ROAD], to: [WEST, SOUTH - HALF_ROAD] },
  { from: [EAST, NORTH + HALF_ROAD], to: [EAST, SOUTH - HALF_ROAD] },
  { from: [CROSS, NORTH + HALF_ROAD], to: [CROSS, SOUTH - HALF_ROAD] },
  { from: [WEST, SOUTH + HALF_ROAD], to: [WEST, EDGE_Z] },
  { from: [CROSS, -EDGE_Z], to: [CROSS, NORTH - HALF_ROAD] },
]

export const park: Lawn = { x: -16, z: 0, width: 30, depth: 34 }
export const pond = { at: [-17, 2] as GroundPoint, radiusX: 8, radiusZ: 6 } as const
export const square = { x: 19, z: 1, width: 12, depth: 10 } as const

const house = (
  x: number,
  z: number,
  width: number,
  depth: number,
  floors: 2 | 3,
  roof: CityBlock['roof'],
  tone: number,
  door: CityBlock['door'],
): CityBlock => ({
  x,
  z,
  width,
  depth,
  height: floors === 3 ? 6.4 : 4.4,
  floors,
  roof,
  roofHeight: roof === 'gable' ? 1.7 : 0,
  tone,
  door,
})

const antennaHouse = house(27, -12, 6, 8, 3, 'flat', 1, '+z')

// Placed by hand around the ring, never closer than a unit to a kerb or a tree.
export const blocks: CityBlock[] = [
  house(-46, -33, 12, 10, 2, 'gable', 0, '+z'),
  house(-32, -33, 9, 9, 3, 'flat', 1, '+z'),
  house(-8, -33, 10, 10, 2, 'gable', 2, '+x'),
  house(16, -34, 11, 9, 2, 'gable', 3, '+z'),
  house(42, -34, 12, 10, 3, 'flat', 0, '+z'),
  house(50, -4, 12, 12, 2, 'gable', 1, '+z'),
  house(51, 24, 11, 10, 3, 'flat', 2, '+z'),
  house(-4, 34, 12, 9, 2, 'gable', 3, '+x'),
  house(12, 33, 9, 9, 2, 'flat', 0, '+z'),
  house(42, 35, 10, 9, 2, 'gable', 1, '+x'),
  house(-47, 17, 7, 5, 2, 'gable', 2, '+x'),
  house(-51, -14, 10, 9, 2, 'gable', 3, '+x'),
  house(-50, 8, 11, 11, 3, 'flat', 0, '+x'),
  antennaHouse,
  house(25, 13, 9, 8, 2, 'gable', 2, '+z'),
]

/** The antenna every probe in town reaches, on the flat roof east of the market. */
export const antenna = {
  at: [antennaHouse.x, antennaHouse.z] as GroundPoint,
  /** Roof level, where the mast stands. */
  base: antennaHouse.height,
  /** Mast and rod together. */
  height: 6,
} as const

export type TreeId =
  | 'markt'
  | 'marktgasse'
  | 'bahnhof'
  | 'schulweg'
  | 'suedring'
  | 'lindenweg'
  | 'kirchplatz'
  | 'kita'
  | 'rathaus'
  | 'teich'
  | 'parkallee'
  | 'friedhof'

export interface TownTree extends Tree {
  id: TreeId
  /** Where the vehicle stands to water it, on a street's centre line. */
  stop: GroundPoint
  /** Share of its water a day without rain takes. */
  rate: number
}

const sensorTree = (
  id: TreeId,
  stop: GroundPoint,
  at: GroundPoint,
  rate: number,
  index: number,
): TownTree => ({
  id,
  stop,
  at,
  rate,
  trunkHeight: 2.1 + (index % 3) * 0.3,
  canopyRadius: 1.75 + (index % 2) * 0.3,
  dark: index % 2 === 1,
})

// Ordered from the fastest to dry to the slowest. The thirstiest six are spread
// round the whole ring, so the tour at START_DAYS passes the hydrant midway.
export const townTrees: TownTree[] = (
  [
    ['markt', [14, NORTH], [14, -16], 0.16],
    ['marktgasse', [CROSS, 8], [10, 8], 0.13],
    ['bahnhof', [EAST, 10], [42, 10], 0.115],
    ['schulweg', [-20, NORTH], [-20, -28], 0.105],
    ['suedring', [16, SOUTH], [16, 16], 0.095],
    ['lindenweg', [WEST, -10], [-42, -10], 0.088],
    ['kirchplatz', [28, NORTH], [28, -28], 0.075],
    ['kita', [-18, SOUTH], [-18, 28], 0.066],
    ['rathaus', [EAST, -4], [30, -4], 0.058],
    ['teich', [CROSS, -8], [-2, -8], 0.045],
    ['parkallee', [WEST, 10], [-30, 10], 0.038],
    ['friedhof', [28, SOUTH], [28, 28], 0.03],
  ] as const
).map(([id, stop, at, rate], index) => sensorTree(id, stop, at, rate, index))

// Greenery without a sensor, so the park reads as a park.
export const looseTrees: Tree[] = [
  { at: [-24, -10], trunkHeight: 2.4, canopyRadius: 2, dark: true },
  { at: [-10, 11], trunkHeight: 2.2, canopyRadius: 1.8, dark: false },
  { at: [-22, 13], trunkHeight: 2.6, canopyRadius: 2.1, dark: true },
  { at: [-6, -14], trunkHeight: 2.3, canopyRadius: 1.9, dark: false },
]

export const DEPOT_SITE = 0
export const HYDRANT_SITE = 1
const FIRST_TREE_SITE = 2

export const siteOfTree = (index: number) => FIRST_TREE_SITE + index
/** The tree at a site, or -1 for the depot and the hydrant. */
export const treeOfSite = (site: number) => (site >= FIRST_TREE_SITE ? site - FIRST_TREE_SITE : -1)

export const sitePoints: GroundPoint[] = [
  depot.stop,
  hydrant.stop,
  ...townTrees.map((tree) => tree.stop),
]

export const townGraph = roadGraph(streets, sitePoints)
/** The depot lies at the end of a dead end, so there is one way to stand there. */
export const DEPOT_ARC = townGraph.arrivals(DEPOT_SITE)[0]

/** Trees one tank waters. */
export const TANK_CAPACITY = 4
/** A refill stop weighs as much as this length of road. */
export const REFILL_COST = 8
/** Where the slider stands when the page loads. */
export const START_DAYS = 9
