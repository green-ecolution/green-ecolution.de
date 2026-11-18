import { depot, plate, townTrees, treeOfSite, type TownTree } from '../../../data/productTown'
import type { Vec3 } from '../../../lib/cameraPose'
import { vehiclePose, type GroundPoint } from '../../../lib/storyPath'
import type { TourFrame, TourScript, TourView } from '../../../lib/wateringDay'
import { PIN_RADIUS, pinHeight } from '../scene3d/pinSize'
import { WHEELBASE } from '../scene3d/Vehicle'
import type { CardCover } from './closeView'
import type { DayLive } from './shared'

export interface TruckPose {
  at: GroundPoint
  /** Angle about the vertical axis, 0 facing +z. */
  heading: number
  /** Road covered since the depot, for the wheels. */
  travelled: number
}

/** What the clock works out once per frame for every other part of the scene. */
export interface Stage {
  frame: TourFrame | null
  truck: TruckPose
  /** Which camera draws the picture; always the slanted one under reduced motion. */
  view: TourView
  /** Set by the rig: where the slanted camera looks and how many world units its picture is high. */
  iso: { at: [number, number, number]; height: number }
  /** Set by the close-up camera: where it stands, or null while the slanted one draws. */
  lens: [number, number, number] | null
}

// Nose to the north, the way the tour leaves the depot.
export const PARKED: TruckPose = { at: depot.stop, heading: Math.PI, travelled: 0 }

/** Share of a stop after which the truck turns towards the way on. */
const TURN_FROM = 0.6

/** From one heading towards another by the shorter way round. */
export function turned(from: number, to: number, share: number): number {
  return from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * share
}

export function truckPose(script: TourScript | null, frame: TourFrame | null): TruckPose {
  if (!script || !frame) return PARKED

  const leg = script.legs[frame.leg]
  const pose = vehiclePose(leg.path, frame.along, WHEELBASE)
  let travelled = frame.along * leg.length
  for (let index = 0; index < frame.leg; index++) travelled += script.legs[index].length

  // A refill in the depot's yard, at the end of a dead end, is left the way the
  // truck came; nowhere else does it turn round. It turns on the spot while it
  // still stands there, so the next leg starts facing the right way.
  let heading = pose.heading
  const next = script.legs[frame.leg + 1]
  if (frame.dwell >= 0 && next && frame.dwellShare > TURN_FROM) {
    const share = (frame.dwellShare - TURN_FROM) / (1 - TURN_FROM)
    const onward = vehiclePose(next.path, 0, WHEELBASE).heading
    heading = turned(heading, onward, share * share * (3 - 2 * share))
  }

  return { at: pose.at, heading, travelled }
}

/** The tree the truck is watering right now. */
export function wateredTree(script: TourScript | null, frame: TourFrame | null): TownTree | null {
  if (!script || !frame || frame.done || frame.dwell < 0) return null
  const { stop } = script.dwells[frame.dwell]
  return stop.kind === 'tree' ? townTrees[treeOfSite(stop.site)] : null
}

export interface Shot {
  /** The point the camera looks at. */
  at: readonly [number, number, number]
  /** 1 fits the whole town into the stage. */
  zoom: number
}

export const OVERVIEW: Shot = { at: [0, 0, 0], zoom: 1 }

const TREE_ZOOM = 2.1
/** Held for the whole drive, stops included, so the camera never zooms in between. */
const FOLLOW_ZOOM = 1.6

const SPAN = plate.width + plate.depth
// What the plate measures on screen under a camera at [d, d, d], with room for
// the roofs at the back and a little air at the sides.
export const TOWN_WIDTH = SPAN / Math.SQRT2 + 4
export const TOWN_HEIGHT = SPAN / Math.sqrt(6) + 12

export interface PictureSize {
  width: number
  height: number
}

/** Pixels per world unit at which the whole town just fits the picture. */
export const townFit = ({ width, height }: PictureSize) =>
  Math.min(width / TOWN_WIDTH, height / TOWN_HEIGHT)

// The slanted camera's picture axes in the world: it looks along [-1, -1, -1].
const PICTURE_RIGHT: Vec3 = [Math.SQRT1_2, 0, -Math.SQRT1_2]
const PICTURE_UP: Vec3 = [-1 / Math.sqrt(6), 2 / Math.sqrt(6), -1 / Math.sqrt(6)]
const along = (axis: Vec3, point: Vec3) =>
  axis[0] * point[0] + axis[1] * point[1] + axis[2] * point[2]

/** Where a point of the town stands in the slanted picture, in pixels from its bottom left corner. */
export function slantedSpot(point: Vec3, shot: Shot, size: PictureSize): [number, number] {
  const scale = townFit(size) * shot.zoom
  const from: Vec3 = [point[0] - shot.at[0], point[1] - shot.at[1], point[2] - shot.at[2]]
  return [
    size.width / 2 + along(PICTURE_RIGHT, from) * scale,
    size.height / 2 + along(PICTURE_UP, from) * scale,
  ]
}

// Each tree's left edge and foot in the picture's axes: what the card must not cover.
const treeCorners = townTrees.map((tree) => {
  const foot: Vec3 = [tree.at[0], 0, tree.at[1]]
  return {
    left: along(PICTURE_RIGHT, foot) - Math.max(tree.canopyRadius, PIN_RADIUS),
    foot: along(PICTURE_UP, foot),
    head: along(PICTURE_UP, [tree.at[0], pinHeight(tree) + PIN_RADIUS, tree.at[1]]),
  }
})

/** Pixels of air between a tree and the card or the bar. */
const MAP_GAP = 14
const MAP_ZOOM_STEP = 0.02
const MIN_MAP_ZOOM = 0.7
const SHIFT_STEPS = 24

/**
 * The whole town with every tree beside or above the card in the picture's
 * bottom left corner: moved right and up as little as that takes, and only as
 * much smaller as the picture's edges and the bar at its top then demand.
 * `bar` is the share of the picture's height the bar covers.
 */
export function mapShot(size: PictureSize, card: CardCover | null, bar: number): Shot {
  if (!card) return OVERVIEW
  const cardRight = card.right * size.width + MAP_GAP
  const cardTop = card.top * size.height + MAP_GAP
  const barBottom = size.height * (1 - bar) - MAP_GAP

  for (let zoom = 1; zoom >= MIN_MAP_ZOOM - 1e-9; zoom -= MAP_ZOOM_STEP) {
    const scale = townFit(size) * zoom
    const roomRight = (size.width - TOWN_WIDTH * scale) / 2
    const roomUp = Math.max(0, (size.height - TOWN_HEIGHT * scale) / 2 - bar * size.height)
    let best: [number, number] | null = null
    for (let i = 0; i <= SHIFT_STEPS; i++) {
      for (let j = 0; j <= SHIFT_STEPS; j++) {
        const right = (roomRight * i) / SHIFT_STEPS
        const up = (roomUp * j) / SHIFT_STEPS
        if (best && Math.hypot(right, up) >= Math.hypot(best[0], best[1])) continue
        const isClear = treeCorners.every(
          ({ left, foot, head }) =>
            (size.width / 2 + left * scale + right >= cardRight ||
              size.height / 2 + foot * scale + up >= cardTop) &&
            // A pin's head keeps out of the bar wherever the town had to move up.
            (up === 0 || size.height / 2 + head * scale + up <= barBottom),
        )
        if (isClear) best = [right, up]
      }
    }
    if (!best) continue
    if (zoom === 1 && best[0] === 0 && best[1] === 0) return OVERVIEW
    // The camera looks the other way from where the town is to go.
    const [right, up] = [best[0] / scale, best[1] / scale]
    return {
      at: [
        -(PICTURE_RIGHT[0] * right + PICTURE_UP[0] * up),
        -(PICTURE_RIGHT[1] * right + PICTURE_UP[1] * up),
        -(PICTURE_RIGHT[2] * right + PICTURE_UP[2] * up),
      ],
      zoom,
    }
  }
  return OVERVIEW
}

/** `map` is the picture for the map's card, framed by the rig for its stage. */
export function shotFor(live: DayLive, stage: Stage, map: Shot = OVERVIEW): Shot {
  const { frame, truck } = stage

  if (live.script && frame && !frame.done) {
    if (frame.shot === 'map') return map
    if (frame.shot === 'plan' || frame.shot === 'home') return OVERVIEW
    // Only the truck's position: a point ahead of it would swing at every
    // corner and wherever the truck turns on the spot.
    return { at: [truck.at[0], 1.5, truck.at[1]], zoom: FOLLOW_ZOOM }
  }

  if (live.selected !== null && !live.script) {
    const tree = townTrees[live.selected]
    return { at: [tree.at[0], 3, tree.at[1]], zoom: TREE_ZOOM }
  }

  return OVERVIEW
}

/** Starts and ends at rest. */
export const glide = (share: number) => share * share * (3 - 2 * share)

/** How far the picture has left the slanted view: 0 there, 1 in the close-ups. */
export function showpieceWeight(view: TourView): number {
  switch (view.mode) {
    case 'iso':
      return 0
    case 'flyIn':
      return glide(view.share)
    case 'flyOut':
      return 1 - glide(view.share)
    default:
      return 1
  }
}
