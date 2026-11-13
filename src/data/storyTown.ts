import { fractionNear, roundedPath, type GroundPoint } from '../lib/storyPath'
import type { ExampleId, ShotId } from '../lib/storyTimeline'
import { roadWidth, type CityBlock, type Lawn, type Tree } from './streamletTour'

// Ground coordinates are [x, z]. The camera looks down from +x and +z, so
// larger sums of the two are nearer to the viewer.
export const plate = { half: 42, radius: 4, thickness: 1.2 } as const

const HALF_ROAD = roadWidth / 2

export interface Road {
  from: GroundPoint
  to: GroundPoint
}

// The two side roads stop where the main road's carriageway begins, so no two
// road surfaces lie in the same plane.
export const roads: Road[] = [
  { from: [-plate.half, 0], to: [plate.half, 0] },
  { from: [0, -plate.half], to: [0, -HALF_ROAD] },
  { from: [20, HALF_ROAD], to: [20, plate.half] },
]

export const depotAt: GroundPoint = [-9.4, -24]

export const blocks: CityBlock[] = [
  {
    x: -26,
    z: -30,
    width: 12,
    depth: 10,
    height: 4.4,
    floors: 2,
    roof: 'gable',
    roofHeight: 1.8,
    tone: 0,
    door: '+z',
  },
  {
    x: -28,
    z: -14,
    width: 9,
    depth: 9,
    height: 6.4,
    floors: 3,
    roof: 'flat',
    roofHeight: 0,
    tone: 1,
    door: '+x',
  },
  {
    x: -12,
    z: -11,
    width: 8,
    depth: 7,
    height: 4.4,
    floors: 2,
    roof: 'gable',
    roofHeight: 1.6,
    tone: 2,
    door: '+x',
  },
  {
    x: 20,
    z: -18,
    width: 13,
    depth: 10,
    height: 6.4,
    floors: 3,
    roof: 'flat',
    roofHeight: 0,
    tone: 3,
    door: '+z',
  },
  {
    x: 33,
    z: -27,
    width: 10,
    depth: 12,
    height: 4.4,
    floors: 2,
    roof: 'gable',
    roofHeight: 1.8,
    tone: 0,
    door: '+z',
  },
  // Far enough from the first side road to keep the winter close-up clear.
  {
    x: 19,
    z: -34,
    width: 10,
    depth: 8,
    height: 4.4,
    floors: 2,
    roof: 'gable',
    roofHeight: 1.6,
    tone: 1,
    door: '+z',
  },
  {
    x: 4,
    z: 32,
    width: 10,
    depth: 9,
    height: 4.4,
    floors: 2,
    roof: 'gable',
    roofHeight: 1.6,
    tone: 2,
    door: '+x',
  },
  {
    x: 33,
    z: 14,
    width: 11,
    depth: 9,
    height: 4.4,
    floors: 2,
    roof: 'flat',
    roofHeight: 0,
    tone: 3,
    door: '+z',
  },
  {
    x: 34,
    z: 32,
    width: 9,
    depth: 9,
    height: 6.4,
    floors: 3,
    roof: 'flat',
    roofHeight: 0,
    tone: 1,
    door: '+x',
  },
]

export const lawn: Lawn = { x: -22, z: 24, width: 30, depth: 30 }

// From the depot gate down the first side road, along the main road and into
// the second side road, where our tree stands. It ends short of the tree so the
// cab parks beside it and not between the camera and the tree pit.
export const tourPath = roundedPath(
  [
    [0, -24],
    [0, 0],
    [20, 0],
    [20, 13],
  ],
  5,
)

export type PinTone = 'ok' | 'warn' | 'alert' | 'info'

export const pinColors: Record<PinTone, string> = {
  ok: '#4CAF50',
  warn: '#F2C230',
  alert: '#E5484D',
  info: '#5B9BC8',
}

export interface StoryTree extends Tree {
  tone: 'ok' | 'warn'
  /** How far along the tour the vehicle has to be for this tree to count as watered. */
  servedAt: number
}

function tree(
  at: GroundPoint,
  tone: StoryTree['tone'],
  trunkHeight: number,
  canopyRadius: number,
  dark: boolean,
): StoryTree {
  return {
    at,
    tone,
    trunkHeight,
    canopyRadius,
    dark,
    servedAt: tone === 'warn' ? fractionNear(tourPath, at) : 0,
  }
}

// In the order their pins come up.
export const storyTrees: StoryTree[] = [
  tree([-6.4, -36], 'ok', 2.4, 2, false),
  tree([30, -6.4], 'ok', 2.6, 2.1, true),
  tree([-22, -6.4], 'ok', 2.2, 1.8, false),
  tree([6.4, -14], 'warn', 2.3, 1.9, true),
  tree([-26, 20], 'ok', 2.7, 2.2, true),
  tree([10, -6.4], 'warn', 2.5, 2, false),
  tree([-12, 30], 'ok', 2.3, 1.9, false),
]

export const heroTree: Tree = { at: [13.6, 18], trunkHeight: 2.6, canopyRadius: 2.2, dark: false }

export interface ExampleSpot {
  id: ExampleId
  /** Where the pin stands. */
  at: GroundPoint
  tone: PinTone
  pinHeight: number
  /** The stretch of road the vehicle drives up on. */
  approach: GroundPoint[]
}

// Same order as EXAMPLES in storyTimeline.ts.
export const exampleSpots: ExampleSpot[] = [
  {
    id: 'bin',
    at: [-6, 4.6],
    tone: 'alert',
    // Clear of the heap that grows out of the bin.
    pinHeight: 4.5,
    approach: [
      [-36, 0],
      [-11, 0],
    ],
  },
  {
    id: 'winter',
    at: [3.9, -35],
    tone: 'info',
    pinHeight: 2.1,
    approach: [
      [0, -41],
      [0, -29],
    ],
  },
  {
    id: 'rain',
    at: [31, 3.9],
    tone: 'warn',
    pinHeight: 2.1,
    approach: [
      [8, 0],
      [24, 0],
    ],
  },
]

export const icePatch = { at: [0, -35] as GroundPoint, width: roadWidth, length: 10 } as const
export const gully = { at: [31, 1.9] as GroundPoint } as const
export const puddle = { at: [31, 1.4] as GroundPoint, radius: 2.6 } as const

export interface Shot {
  /** The point the camera looks at. */
  at: readonly [number, number, number]
  /** Enlargement against the shot that shows the whole town. */
  zoom: number
}

export const shots: Record<ShotId, Shot> = {
  tree: { at: [13.6, 2.6, 18], zoom: 3.6 },
  town: { at: [0, 1, 0], zoom: 1 },
  watering: { at: [16.5, 2, 17], zoom: 2.3 },
  bin: { at: [-8, 1.5, 3], zoom: 2.5 },
  winter: { at: [1, 1.5, -34], zoom: 2.5 },
  rain: { at: [28, 1.5, 1], zoom: 2.5 },
}
