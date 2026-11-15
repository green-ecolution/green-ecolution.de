import { depot, townTrees, treeOfSite, type TownTree } from '../../../data/productTown'
import { vehiclePose, type GroundPoint } from '../../../lib/storyPath'
import type { TourFrame, TourScript, TourView } from '../../../lib/wateringDay'
import { WHEELBASE } from '../scene3d/Vehicle'
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

export function shotFor(live: DayLive, stage: Stage): Shot {
  const { frame, truck } = stage

  if (live.script && frame && !frame.done) {
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
