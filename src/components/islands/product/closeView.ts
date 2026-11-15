import {
  blocks,
  depot,
  gateway,
  hydrant,
  plate,
  townTrees,
  treeOfSite,
  type TownTree,
} from '../../../data/productTown'
import {
  canopyCenterHeight,
  depotDepth,
  depotHeight,
  depotRoofHeight,
  depotWidth,
  roadHeight,
  type Tree,
} from '../../../data/streamletTour'
import { blendPoses, projected, type CameraPose, type Vec3 } from '../../../lib/cameraPose'
import type { GroundPoint } from '../../../lib/storyPath'
import { tourFrame, type TourScript } from '../../../lib/wateringDay'
import { PIN_HULL, PIN_RADIUS, pinHeight } from '../scene3d/pinSize'
import { treePit } from '../scene3d/trees'
import { PIT_TOP, PROBE, PROBE_TOP, probeAt } from './probe'
import { GATEWAY_TIP } from './relay'
import { truckPose } from './stage'

interface Framing {
  /** Where the camera starts and creeps to, ahead of the truck and towards the subject. */
  start: { ahead: number; aside: number }
  end: { ahead: number; aside: number }
  up: number
  /** The lens where no framing for the picture fits. */
  fov: number
}

// Ahead of the truck and a little towards the subject, low over the road:
// truck, jet or hose, and tree or hydrant in one picture.
const WATERING: Framing = {
  start: { ahead: 20, aside: 1.5 },
  end: { ahead: 18.5, aside: 3 },
  up: 3.8,
  fov: 46,
}
const REFILLING: Framing = {
  start: { ahead: 17, aside: 3 },
  end: { ahead: 15, aside: 4.5 },
  up: 3.6,
  fov: 46,
}
// Low on the road beside the stop, looking along it at the tree. Far enough
// that the pin over the crown keeps its full size (NEAR_LENS in actors).
const PROBING: Framing = {
  start: { ahead: 16.5, aside: 1 },
  end: { ahead: 15, aside: 1.8 },
  up: 2.6,
  fov: 40,
}
/** Shares of the usual distance ahead the camera tries, nearest last. */
const NEARER = [1, 0.85, 0.7, 0.55] as const
/** How much higher the camera stands per share it comes nearer. */
const RAISE = 3
const HOUSE_CLEARANCE = 1.5
const SIGHT_CLEARANCE = 0.3
const PLATE_MARGIN = 3

interface Box {
  x: number
  z: number
  halfX: number
  halfZ: number
}

const DEPOT_HALF = Math.max(depotWidth, depotDepth) / 2
const obstacles: Box[] = [
  ...blocks.map((block) => ({
    x: block.x,
    z: block.z,
    halfX: block.width / 2,
    halfZ: block.depth / 2,
  })),
  { x: depot.at[0], z: depot.at[1], halfX: DEPOT_HALF, halfZ: DEPOT_HALF },
]

const inside = ([x, z]: GroundPoint, box: Box, margin: number) =>
  Math.abs(x - box.x) < box.halfX + margin && Math.abs(z - box.z) < box.halfZ + margin

// Clips the segment against the box's slabs.
function crosses(from: GroundPoint, to: GroundPoint, box: Box, margin: number): boolean {
  let enter = 0
  let leave = 1
  const axes = [
    [from[0], to[0] - from[0], box.x, box.halfX + margin],
    [from[1], to[1] - from[1], box.z, box.halfZ + margin],
  ] as const
  for (const [start, step, centre, half] of axes) {
    if (Math.abs(step) < 1e-9) {
      if (Math.abs(start - centre) >= half) return false
      continue
    }
    const a = (centre - half - start) / step
    const b = (centre + half - start) / step
    enter = Math.max(enter, Math.min(a, b))
    leave = Math.min(leave, Math.max(a, b))
    if (enter >= leave) return false
  }
  return true
}

/** On the plate, out of every house, and with a free line to the subject and the truck. */
export function isClearSpot(
  camera: GroundPoint,
  subject: GroundPoint,
  truck: GroundPoint,
): boolean {
  if (
    Math.abs(camera[0]) > plate.width / 2 - PLATE_MARGIN ||
    Math.abs(camera[1]) > plate.depth / 2 - PLATE_MARGIN
  ) {
    return false
  }
  return obstacles.every(
    (box) =>
      !inside(camera, box, HOUSE_CLEARANCE) &&
      !crosses(camera, subject, box, SIGHT_CLEARANCE) &&
      !crosses(camera, truck, box, SIGHT_CLEARANCE),
  )
}

export interface CloseView {
  from: CameraPose
  to: CameraPose
  /** What the picture has to hold from start to end. */
  subjects: Vec3[]
  /** False when no candidate passed and the default stands in. */
  clear: boolean
}

// The tanker of scene3d/Vehicle in its own frame, nose to +z, with the monitor on top.
const TRUCK_BOX = { half: 1.7, back: -4.6, front: 5.3, top: 5 } as const

function truckCorners(truck: GroundPoint, heading: number): Vec3[] {
  const sin = Math.sin(heading)
  const cos = Math.cos(heading)
  return [-TRUCK_BOX.half, TRUCK_BOX.half].flatMap((across) =>
    [TRUCK_BOX.back, TRUCK_BOX.front].flatMap((along) =>
      [roadHeight, roadHeight + TRUCK_BOX.top].map((y): Vec3 => [
        truck[0] + across * cos + along * sin,
        y,
        truck[1] - across * sin + along * cos,
      ]),
    ),
  )
}

// A ball round the crown's lobes, in canopy radii.
const CROWN = { radius: 1.3, lift: 0.1 } as const
// Above the middle of the way from the monitor to the tree, a little over the jet's arc.
const JET_TOP = 6
// Directions from a centre to the faces, edges and corners of a cube, on the unit sphere.
const ROUND = [-1, 0, 1]
  .flatMap((x) => [-1, 0, 1].flatMap((y) => [-1, 0, 1].map((z): Vec3 => [x, y, z])))
  .filter(([x, y, z]) => x !== 0 || y !== 0 || z !== 0)
  .map(([x, y, z]): Vec3 => {
    const length = Math.hypot(x, y, z)
    return [x / length, y / length, z / length]
  })

// The crown, the pit round the trunk, and the pin over the crown.
function treeSubjects(tree: Tree): Vec3[] {
  const [x, z] = tree.at
  const radius = tree.canopyRadius * CROWN.radius
  const centre = canopyCenterHeight(tree) + tree.canopyRadius * CROWN.lift
  return [
    ...ROUND.map(([dx, dy, dz]): Vec3 => [x + dx * radius, centre + dy * radius, z + dz * radius]),
    ...ROUND.filter(([, dy]) => dy === 0).map(([dx, , dz]): Vec3 => [
      x + dx * treePit.radius,
      roadHeight,
      z + dz * treePit.radius,
    ]),
    [x, pinHeight(tree) + PIN_RADIUS * PIN_HULL, z],
  ]
}

function wateringSubjects(truck: GroundPoint, heading: number, tree: Tree): Vec3[] {
  const [x, z] = tree.at
  return [
    ...truckCorners(truck, heading),
    [(truck[0] + x) / 2, JET_TOP, (truck[1] + z) / 2],
    ...treeSubjects(tree),
  ]
}

function probeSubjects(tree: TownTree): Vec3[] {
  const [x, z] = probeAt(tree)
  const half = PROBE.width / 2
  return [
    ...[-half, half].flatMap((dx) =>
      [-half, half].flatMap((dz) => [PIT_TOP, PROBE_TOP].map((y): Vec3 => [x + dx, y, z + dz])),
    ),
    ...treeSubjects(tree),
  ]
}

const HYDRANT_BOX = { halfX: 1, halfZ: 0.3, top: 2.2 } as const
// Where the hose arches over the tank, short of the filler dome.
const HOSE_ARCH = { back: 1.4, up: 5.6 } as const

function refillSubjects(truck: GroundPoint, heading: number): Vec3[] {
  const [x, z] = hydrant.at
  const toHydrant = Math.hypot(x - truck[0], z - truck[1]) || 1
  return [
    ...truckCorners(truck, heading),
    ...[-HYDRANT_BOX.halfX, HYDRANT_BOX.halfX].flatMap((dx) =>
      [-HYDRANT_BOX.halfZ, HYDRANT_BOX.halfZ].flatMap((dz) =>
        [0, HYDRANT_BOX.top].map((y): Vec3 => [x + dx, y, z + dz]),
      ),
    ),
    [
      truck[0] + ((x - truck[0]) / toHydrant) * HOSE_ARCH.back,
      HOSE_ARCH.up,
      truck[1] + ((z - truck[1]) / toHydrant) * HOSE_ARCH.back,
    ],
  ]
}

// The middle of everything the picture holds; the lens shift does the rest.
function middleOf(subjects: readonly Vec3[]): Vec3 {
  const middle = (axis: number) => {
    const values = subjects.map((point) => point[axis])
    return (Math.min(...values) + Math.max(...values)) / 2
  }
  return [middle(0), middle(1), middle(2)]
}

function closeView(
  truck: GroundPoint,
  heading: number,
  subject: GroundPoint,
  subjects: Vec3[],
  framing: Framing,
): CloseView {
  const forward: GroundPoint = [Math.sin(heading), Math.cos(heading)]
  const span = Math.hypot(subject[0] - truck[0], subject[1] - truck[1]) || 1
  const toSubject: GroundPoint = [(subject[0] - truck[0]) / span, (subject[1] - truck[1]) / span]
  const target = middleOf(subjects)
  const spot = (place: Framing['start'], ahead: number, aside: number) =>
    [
      truck[0] + forward[0] * place.ahead * ahead + toSubject[0] * place.aside * aside,
      truck[1] + forward[1] * place.ahead * ahead + toSubject[1] * place.aside * aside,
    ] as const
  const pose = ([x, z]: GroundPoint, up: number): CameraPose => ({
    position: [x, roadHeight + up, z],
    target,
    fov: framing.fov,
  })

  // The cab faces the camera wherever any spot ahead is free: nearer and a
  // little higher, on either side of the road. Behind the truck is the last resort.
  const sides = [
    ...NEARER.flatMap((nearer) => [
      [nearer, 1],
      [nearer, -1],
    ]),
    [-1, 1],
    [-1, -1],
  ] as const
  for (const [ahead, aside] of sides) {
    const from = spot(framing.start, ahead, aside)
    const to = spot(framing.end, ahead, aside)
    const up = framing.up + (1 - Math.abs(ahead)) * RAISE
    if (isClearSpot(from, subject, truck) && isClearSpot(to, subject, truck)) {
      return { from: pose(from, up), to: pose(to, up), subjects, clear: true }
    }
  }
  return {
    from: pose(spot(framing.start, 1, 1), framing.up),
    to: pose(spot(framing.end, 1, 1), framing.up),
    subjects,
    clear: false,
  }
}

// The hall's walls and the ridge of its roof, which runs along x.
function depotSubjects(): Vec3[] {
  const [x, z] = depot.at
  const halfX = depotWidth / 2
  const halfZ = depotDepth / 2
  return [-halfX, halfX].flatMap((dx) => [
    ...[-halfZ, halfZ].flatMap((dz) => [0, depotHeight].map((y): Vec3 => [x + dx, y, z + dz])),
    [x + dx, depotHeight + depotRoofHeight, z] as const,
  ])
}

/** In front of the gate, so the line to it does not count the hall as in the way. */
const GATE: GroundPoint = [depot.at[0] + DEPOT_HALF + SIGHT_CLEARANCE + 0.2, depot.at[1]]

/**
 * Where the camera may stand for the result, in the truck's frame: ahead of
 * it, off to the side away from the hall, and how high. From behind and above
 * the hall's gate shows beside the tanker; from the side in front, where the
 * stub ends at the edge of the plate, the tanker hides the gate, so those
 * spots are the fallback.
 */
const RESULT_SPOTS = [
  { ahead: -11, away: 5, up: 14 },
  { ahead: 6, away: 17, up: 6 },
  { ahead: 6, away: 14, up: 6.5 },
  { ahead: 4, away: 20, up: 6 },
  { ahead: -9, away: 14, up: 6.5 },
  { ahead: -12, away: 8, up: 7 },
] as const
/** How much of its distance to the truck the camera creeps over the hold. */
const RESULT_CREEP = 0.08

/** The truck back at the depot with the hall beside it. */
export function resultView(truck: GroundPoint, heading: number): CloseView {
  const forward: GroundPoint = [Math.sin(heading), Math.cos(heading)]
  const side: GroundPoint = [forward[1], -forward[0]]
  const hallSide =
    (depot.at[0] - truck[0]) * side[0] + (depot.at[1] - truck[1]) * side[1] > 0 ? 1 : -1
  const subjects = [...truckCorners(truck, heading), ...depotSubjects()]
  const target = middleOf(subjects)
  const spotOf = ({ ahead, away }: { ahead: number; away: number }, share: number): GroundPoint => [
    truck[0] + (forward[0] * ahead - side[0] * hallSide * away) * share,
    truck[1] + (forward[1] * ahead - side[1] * hallSide * away) * share,
  ]
  const pose = ([x, z]: GroundPoint, up: number): CameraPose => ({
    position: [x, roadHeight + up, z],
    target,
    fov: 46,
  })
  for (const spot of RESULT_SPOTS) {
    const from = spotOf(spot, 1)
    const to = spotOf(spot, 1 - RESULT_CREEP)
    if (isClearSpot(from, GATE, truck) && isClearSpot(to, GATE, truck)) {
      return { from: pose(from, spot.up), to: pose(to, spot.up), subjects, clear: true }
    }
  }
  const [first] = RESULT_SPOTS
  return {
    from: pose(spotOf(first, 1), first.up),
    to: pose(spotOf(first, 1 - RESULT_CREEP), first.up),
    subjects,
    clear: false,
  }
}

const gatewayHouse = blocks.find((block) => block.x === gateway.at[0] && block.z === gateway.at[1])
/** Room over the gateway's tip for the rings that rise from it. */
const RING_ROOM = 4
/** How much of the house under the roof belongs to the picture. */
const WALL_SHOWN = 3

// The roof it stands on, a storey of the house below, and the air over its tip.
const gatewaySubjects: Vec3[] = [
  ...[-1, 1].flatMap((sideX) =>
    [-1, 1].flatMap((sideZ) =>
      [gateway.base, gateway.base - WALL_SHOWN].map((y): Vec3 => [
        gateway.at[0] + (sideX * (gatewayHouse?.width ?? 0)) / 2,
        y,
        gateway.at[1] + (sideZ * (gatewayHouse?.depth ?? 0)) / 2,
      ]),
    ),
  ),
  [GATEWAY_TIP[0], GATEWAY_TIP[1] + RING_ROOM, GATEWAY_TIP[2]],
]

/**
 * The gateway on its roof, from the side of the slanted camera and above the
 * roofs around: no house stands in the way up there, so it needs no search.
 */
export const gatewayView = (): CloseView => {
  const target = middleOf(gatewaySubjects)
  const pose = (aside: number, up: number): CameraPose => ({
    position: [gateway.at[0] + aside, gateway.base + up, gateway.at[1] + aside],
    target,
    fov: 40,
  })
  return { from: pose(15, 9), to: pose(13.5, 8), subjects: gatewaySubjects, clear: true }
}

/** The corner of the picture a card covers from the bottom left, as shares of its width and height. */
export interface CardCover {
  right: number
  top: number
}

// In half picture sizes: air round the subjects, and between them and the card.
const FRAME_MARGIN = 0.05
const CARD_GAP = 0.07
/** How much wider than the tightest fit the close-ups start and end. */
const SLACK = { from: 1.12, to: 1.03 } as const
const SEARCH_STEPS = 48
const CREEP_CHECKS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

/**
 * Lens and lens shift that hold every subject in the picture and clear of the
 * card, as large as that allows; the camera keeps its place and direction.
 * Null when no lens up to a very wide one manages it.
 */
export function framePose(
  pose: CameraPose,
  subjects: readonly Vec3[],
  aspect: number,
  card: CardCover | null,
  slack: number,
): CameraPose | null {
  // Where each subject lies seen through a lens of tan 1 without shift.
  const flat = { ...pose, fov: 90, shift: undefined }
  const spots = subjects.map((point) => projected(flat, aspect, point))
  const seen = spots.filter((spot) => spot !== null)
  if (seen.length < spots.length) return null
  const xs = seen.map(([x]) => x * aspect)
  const ys = seen.map(([, y]) => y)
  const inner = 1 - FRAME_MARGIN
  // Card edges in the picture, -1 to 1, with the gap added.
  const edge = card && { x: card.right * 2 - 1 + CARD_GAP, y: card.top * 2 - 1 + CARD_GAP }

  // For a lens of half height `tan`: the range of picture centres that holds
  // every subject, and whether its bottom left corner, the centre that pushes
  // the subjects furthest up and right, keeps them all clear of the card.
  const centres = (tan: number) => ({
    x: [Math.max(...xs) - inner * tan * aspect, Math.min(...xs) + inner * tan * aspect],
    y: [Math.max(...ys) - inner * tan, Math.min(...ys) + inner * tan],
  })
  const isClear = (tan: number, x: number, y: number) =>
    !edge ||
    xs.every(
      (spotX, index) => (spotX - x) / (tan * aspect) >= edge.x || (ys[index] - y) / tan >= edge.y,
    )

  const tightest = Math.max(
    (Math.max(...xs) - Math.min(...xs)) / (2 * inner * aspect),
    (Math.max(...ys) - Math.min(...ys)) / (2 * inner),
  )
  let tan = tightest
  while (tan < tightest * 4) {
    const { x, y } = centres(tan)
    if (isClear(tan, x[0], y[0])) break
    tan *= 1.01
  }
  if (tan >= tightest * 4) return null
  tan *= slack

  // The free centre nearest the middle of the range, for a balanced picture.
  const { x, y } = centres(tan)
  const middle = [(x[0] + x[1]) / 2, (y[0] + y[1]) / 2]
  let best = [x[0], y[0]]
  let nearest = Infinity
  for (let i = 0; i <= SEARCH_STEPS; i++) {
    for (let j = 0; j <= SEARCH_STEPS; j++) {
      const cx = x[0] + ((x[1] - x[0]) * i) / SEARCH_STEPS
      const cy = y[0] + ((y[1] - y[0]) * j) / SEARCH_STEPS
      const away = Math.hypot(cx - middle[0], cy - middle[1])
      if (away < nearest && isClear(tan, cx, cy)) {
        nearest = away
        best = [cx, cy]
      }
    }
  }
  return {
    ...pose,
    fov: (Math.atan(tan) * 360) / Math.PI,
    shift: [best[0] / (tan * aspect), best[1] / tan],
  }
}

function holdsAll(pose: CameraPose, view: CloseView, aspect: number, card: CardCover | null) {
  return view.subjects.every((subject) => {
    const spot = projected(pose, aspect, subject)
    if (!spot) return false
    const [x, y] = spot
    const isBehindCard = card !== null && x < card.right * 2 - 1 && y < card.top * 2 - 1
    return Math.abs(x) < 1 && Math.abs(y) < 1 && !isBehindCard
  })
}

/**
 * The close-up framed for this picture, or as it was where no framing fits.
 * Both ends are framed on their own; where the creep between them would let
 * a subject slip under the card or out of the picture, both open a little.
 */
export function framedView(view: CloseView, aspect: number, card: CardCover | null): CloseView {
  const frame = (pose: CameraPose, slack: number) =>
    framePose(pose, view.subjects, aspect, card, slack) ?? pose
  let framed = view
  for (let wider = 1; wider < 1.5; wider += 0.03) {
    framed = {
      ...view,
      from: frame(view.from, SLACK.from * wider),
      to: frame(view.to, SLACK.to * wider),
    }
    const creep = CREEP_CHECKS.map((share) => blendPoses(framed.from, framed.to, share))
    if (creep.every((pose) => holdsAll(pose, framed, aspect, card))) break
  }
  return framed
}

export const wateringView = (truck: GroundPoint, heading: number, tree: Tree) =>
  closeView(truck, heading, tree.at, wateringSubjects(truck, heading, tree), WATERING)

/** The tree before the tour, seen from the road at its stop, where the truck will water it. */
export const probeView = (stop: GroundPoint, heading: number, tree: TownTree) =>
  closeView(stop, heading, tree.at, probeSubjects(tree), PROBING)

export const refillView = (truck: GroundPoint, heading: number) =>
  closeView(truck, heading, hydrant.at, refillSubjects(truck, heading), REFILLING)

export interface StopPose {
  truck: GroundPoint
  heading: number
}

function arrivedAt(script: TourScript, leg: number): StopPose {
  const pose = truckPose(script, tourFrame(script, script.legs[leg].end))
  return { truck: pose.at, heading: pose.heading }
}

/** Where the truck stands at the stop after the ride, and the tree it waters there. */
export function showpieceStop(script: TourScript): (StopPose & { tree: TownTree }) | null {
  const { showpiece } = script
  if (!showpiece) return null
  const tree = treeOfSite(script.dwells[showpiece.leg].stop.site)
  if (tree < 0) return null
  return { ...arrivedAt(script, showpiece.leg), tree: townTrees[tree] }
}

/** Where the truck stands at the hydrant for the refill close-up. */
export function refillStop(script: TourScript): StopPose | null {
  return script.refillShot ? arrivedAt(script, script.refillShot.stop) : null
}

/** Where the truck stands back at the depot. */
export const homeStop = (script: TourScript): StopPose =>
  arrivedAt(script, script.dwells.length - 1)
