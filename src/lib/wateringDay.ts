import { pathLength, roundedPath, type GroundPoint } from './storyPath'
import type { Plan, PlanStop } from './wateringPlan'

/** Road units per second. */
export const CRUISE = 15
/** The truck slows to this as the camera comes down to the seat, so the ride is calm. */
export const RIDE_CRUISE = 5.5
export const PLAN_SECONDS = 1.6
export const WATER_SECONDS = 2.2
export const REFILL_SECONDS = 2.6
export const MAX_TOUR_SECONDS = 105
export const CORNER_RADIUS = 3.5

/** On a way too short to cruise first: how long after the truck pulls away the camera starts down. */
const FLY_IN_DELAY = 0.4
/** Seconds the truck takes to pull away to full speed on the way to the first tree. */
const PULL_SECONDS = 1
/** Seconds it takes to slow from cruising to the ride, from the start of the fly-in. */
const SLOW_SECONDS = 1
/** Every leg starts at this share of its top speed. */
const START_SPEED = 0.4
export const FLY_IN_SECONDS = 2
export const RIDE_SECONDS = 5.5
export const RIDE_MIN_SECONDS = 3
export const TO_WATERING_SECONDS = 1.6
export const FLY_OUT_SECONDS = 2
/** The fly-out starts this long before the truck drives on. */
const FLY_OUT_EARLY = 0.5
/** How long each close-up holds still while its card explains it. */
export const PROBE_HOLD_SECONDS = 7
export const WATERING_HOLD_SECONDS = 7
export const REFILL_HOLD_SECONDS = 8
export const RESULT_HOLD_SECONDS = 8
export const GATEWAY_HOLD_SECONDS = 7
/** The camera follows the probe's message from the probe to the gateway for this long. */
export const TO_GATEWAY_SECONDS = 3
/** The message's way on from the gateway to the depot; the camera flies back up as it sets out. */
export const TO_DEPOT_SECONDS = 3
/** The slanted view holds this long once the message is in, before the route draws. */
export const MAP_HOLD_SECONDS = 7
/** A beat of the slanted view after the day starts before the camera flies to the probe. */
const PROBE_DELAY = 0.3
/** The slanted view between two close-ups lasts at least this long. */
const CLOSE_UP_GAP = 1.5

/**
 * How the truck drives the way to the first tree, in seconds before any
 * pacing: it pulls away to `top`, cruises, slows to the ride speed as the
 * camera comes down and keeps that speed until it arrives.
 */
export interface RiddenDrive {
  top: number
  /** End of the pull-away. */
  pulled: number
  /** Start and end of the slowdown. */
  slowFrom: number
  slowTo: number
  duration: number
  /** When the camera starts down to the seat. */
  flyIn: number
}

export interface TourLeg {
  path: GroundPoint[]
  length: number
  start: number
  end: number
  /** Set on the way the camera rides along; other legs ease over their whole length. */
  drive: RiddenDrive | null
}

export interface TourDwell {
  stop: PlanStop
  start: number
  end: number
}

export interface TimeWindow {
  start: number
  end: number
}

/**
 * The close-up of the first tree, in seconds of the tour: down into the truck
 * for the ride there when the way is long enough, else straight down to the
 * watering view, then the watering with its card and back up.
 */
export interface Showpiece {
  /** The leg to the first tree; the stop at its end is watched from the ground. */
  leg: number
  flyIn: TimeWindow
  ride: TimeWindow | null
  toWatering: TimeWindow | null
  watering: TimeWindow
  flyOut: TimeWindow
}

/** A close-up that flies down, holds still with its card and flies back up. */
export interface HeldShot {
  flyIn: TimeWindow
  shot: TimeWindow
  flyOut: TimeWindow
}

/** The close-up of the probe: down to it and a hold with its card; the way on leads to the gateway. */
export interface ProbeShot {
  flyIn: TimeWindow
  shot: TimeWindow
}

/**
 * The close-up of the gateway: the camera comes over from the probe with the
 * message, holds with its card and flies back up as the message goes on.
 */
export interface GatewayShot extends HeldShot {
  /** The message's way on to the depot: it starts with the fly-out and outlasts it. */
  toDepot: TimeWindow
}

/** The close-up at the hydrant: down as the truck stops, back up as it drives on. */
export interface RefillShot extends HeldShot {
  /** Index of the refill stop in `dwells`. */
  stop: number
}

export interface TourScript {
  /** legs[i] ends at dwells[i]; the last dwell is the arrival at the depot. */
  legs: TourLeg[]
  dwells: TourDwell[]
  capacity: number
  /** While the route draws itself, after the map has shown who needs water. */
  plan: TimeWindow
  /** When the first leg starts, the end of `plan`. */
  lead: number
  duration: number
  /** The probe at the first tree reports before the truck leaves; null on a tour without a tree. */
  probeShot: ProbeShot | null
  /** The probe's message on its way to the depot by the gateway; null on a tour without a probe. */
  gatewayShot: GatewayShot | null
  /**
   * The message is in and the map shows who needs water: the slanted view
   * holds with a card before the route draws; null on a tour without a probe.
   */
  mapHold: TimeWindow | null
  showpiece: Showpiece | null
  refillShot: RefillShot | null
  /** The day's result at the depot; the tour is over when its fly-out ends. */
  resultShot: HeldShot
}

const dwellSeconds = (stop: PlanStop) =>
  stop.kind === 'tree' ? WATER_SECONDS : stop.kind === 'refill' ? REFILL_SECONDS : 0

const pullDistance = (top: number) => (1 + START_SPEED) * 0.5 * top * PULL_SECONDS

/**
 * The drive along a way that is long enough for a ride, or null. The ride lasts
 * RIDE_SECONDS at RIDE_CRUISE where the way allows it. A shorter way gets a
 * reduced top speed above the ride speed while it still allows the pull-away,
 * and below that is driven at ride speed throughout.
 */
export function riddenDrive(length: number): RiddenDrive | null {
  const calm = RIDE_CRUISE * (FLY_IN_SECONDS + RIDE_SECONDS - SLOW_SECONDS)
  const slowing = (top: number) => ((top + RIDE_CRUISE) / 2) * SLOW_SECONDS
  // Without cruising: the top speed that just covers the way.
  const top = Math.min(
    CRUISE,
    (length - RIDE_CRUISE * SLOW_SECONDS * 0.5 - calm) /
      ((1 + START_SPEED) * 0.5 * PULL_SECONDS + SLOW_SECONDS * 0.5),
  )
  if (top >= RIDE_CRUISE) {
    const cruising = (length - pullDistance(top) - slowing(top) - calm) / top
    const slowFrom = PULL_SECONDS + cruising
    return {
      top,
      pulled: PULL_SECONDS,
      slowFrom,
      slowTo: slowFrom + SLOW_SECONDS,
      duration: slowFrom + FLY_IN_SECONDS + RIDE_SECONDS,
      flyIn: slowFrom,
    }
  }
  const duration = PULL_SECONDS + (length - pullDistance(RIDE_CRUISE)) / RIDE_CRUISE
  if (duration - FLY_IN_DELAY - FLY_IN_SECONDS < RIDE_MIN_SECONDS) return null
  return {
    top: RIDE_CRUISE,
    pulled: PULL_SECONDS,
    slowFrom: PULL_SECONDS,
    slowTo: PULL_SECONDS,
    duration,
    flyIn: FLY_IN_DELAY,
  }
}

// Distance covered after `time` seconds of a speed eased from `from` to `to` over `span`.
function easedDistance(from: number, to: number, span: number, time: number) {
  if (span <= 0) return 0
  const t = clamp01(time / span)
  // Integral of the smoothstep from 0 to t.
  return span * (from * t + (to - from) * (t * t * t - (t * t * t * t) / 2))
}

/** Road covered after `time` seconds of the ridden drive. */
export function drivenDistance(drive: RiddenDrive, time: number): number {
  const { top, pulled, slowFrom, slowTo } = drive
  const pulling = easedDistance(START_SPEED * top, top, pulled, Math.min(time, pulled))
  const cruising = top * Math.min(slowFrom - pulled, Math.max(0, time - pulled))
  const slowing = easedDistance(top, RIDE_CRUISE, slowTo - slowFrom, Math.max(0, time - slowFrom))
  const riding = RIDE_CRUISE * Math.max(0, time - slowTo)
  return pulling + cruising + slowing + riding
}

export function tourScript(
  plan: Plan,
  pathBetween: (fromArc: number, toArc: number) => GroundPoint[],
  /** Where the tour starts: the depot's site and the arc the truck stands on there. */
  depot: { site: number; arc: number },
  capacity: number,
): TourScript {
  if (plan.stops.length === 0) throw new Error('a tour needs at least one stop')
  const paths = plan.stops.map((stop, index) =>
    roundedPath(
      pathBetween(index === 0 ? depot.arc : plan.stops[index - 1].arc, stop.arc),
      CORNER_RADIUS,
    ),
  )
  const lengths = paths.map(pathLength)

  // The first tree gets the close-up; the leg there is ridden if it is long enough.
  const ridden = plan.stops.findIndex((stop) => stop.kind === 'tree')
  const drive = ridden >= 0 ? riddenDrive(lengths[ridden]) : null
  const isRidden = drive !== null

  const driving = lengths.map((length, index) =>
    index === ridden && drive ? drive.duration : length / CRUISE,
  )
  // A refill at the depot is not worth a close-up.
  const refilled = plan.stops.findIndex(
    (stop) => stop.kind === 'refill' && stop.site !== depot.site,
  )

  const last = plan.stops.length - 1
  const probing =
    ridden >= 0
      ? PROBE_DELAY +
        FLY_IN_SECONDS +
        PROBE_HOLD_SECONDS +
        TO_GATEWAY_SECONDS +
        GATEWAY_HOLD_SECONDS +
        TO_DEPOT_SECONDS
      : 0
  const mapping = ridden >= 0 ? MAP_HOLD_SECONDS : 0

  // Every time in the tour is a multiple of `pace`, so the tour at pace 1 tells
  // how far it has to be slowed down to fit and which close-ups crowd each other.
  const timed = (closeUp: number, pace: number) => {
    const standing = plan.stops.map((stop, index): number =>
      index === ridden
        ? (isRidden ? TO_WATERING_SECONDS : 0) + WATERING_HOLD_SECONDS + FLY_OUT_EARLY
        : index === closeUp
          ? REFILL_HOLD_SECONDS + FLY_OUT_EARLY
          : index === last
            ? RESULT_HOLD_SECONDS + FLY_OUT_SECONDS
            : dwellSeconds(stop),
    )

    let probeShot: ProbeShot | null = null
    let gatewayShot: GatewayShot | null = null
    if (ridden >= 0) {
      const start = PROBE_DELAY * pace
      const landed = start + FLY_IN_SECONDS * pace
      const held = landed + PROBE_HOLD_SECONDS * pace
      probeShot = { flyIn: { start, end: landed }, shot: { start: landed, end: held } }
      const arrived = held + TO_GATEWAY_SECONDS * pace
      const left = arrived + GATEWAY_HOLD_SECONDS * pace
      gatewayShot = {
        flyIn: { start: held, end: arrived },
        shot: { start: arrived, end: left },
        flyOut: { start: left, end: left + FLY_OUT_SECONDS * pace },
        toDepot: { start: left, end: probing * pace },
      }
    }
    const mapHold = ridden >= 0 ? { start: probing * pace, end: (probing + mapping) * pace } : null
    const planWindow = {
      start: (probing + mapping) * pace,
      end: (probing + mapping + PLAN_SECONDS) * pace,
    }

    const legs: TourLeg[] = []
    const dwells: TourDwell[] = []
    let clock = planWindow.end
    plan.stops.forEach((stop, index) => {
      const start = clock
      clock += driving[index] * pace
      legs.push({
        path: paths[index],
        length: lengths[index],
        start,
        end: clock,
        drive: index === ridden ? drive : null,
      })
      const arrived = clock
      clock += standing[index] * pace
      dwells.push({ stop, start: arrived, end: clock })
    })
    const flyOut = (start: number) => ({
      start,
      end: Math.min(clock, start + FLY_OUT_SECONDS * pace),
    })

    let showpiece: Showpiece | null = null
    if (ridden >= 0) {
      const leg = legs[ridden]
      const stop = dwells[ridden]
      const flyOutStart = stop.end - FLY_OUT_EARLY * pace
      if (drive) {
        const flyInStart = leg.start + drive.flyIn * pace
        const rideStart = flyInStart + FLY_IN_SECONDS * pace
        const wateringStart = stop.start + TO_WATERING_SECONDS * pace
        showpiece = {
          leg: ridden,
          flyIn: { start: flyInStart, end: rideStart },
          ride: { start: rideStart, end: leg.end },
          toWatering: { start: stop.start, end: wateringStart },
          watering: { start: wateringStart, end: flyOutStart },
          flyOut: flyOut(flyOutStart),
        }
      } else {
        // Lands as the truck stops, but not before the route has drawn itself.
        const flyInStart = Math.max(planWindow.end, stop.start - FLY_IN_SECONDS * pace)
        showpiece = {
          leg: ridden,
          flyIn: { start: flyInStart, end: stop.start },
          ride: null,
          toWatering: null,
          watering: { start: stop.start, end: flyOutStart },
          flyOut: flyOut(flyOutStart),
        }
      }
    }

    let refillShot: RefillShot | null = null
    if (closeUp >= 0) {
      const stop = dwells[closeUp]
      const shotEnd = stop.end - FLY_OUT_EARLY * pace
      refillShot = {
        stop: closeUp,
        flyIn: { start: stop.start - FLY_IN_SECONDS * pace, end: stop.start },
        shot: { start: stop.start, end: shotEnd },
        flyOut: flyOut(shotEnd),
      }
    }

    // Lands as the truck stops at the depot, unless the close-up before it
    // is still flying out: then it waits for that and the stop lasts longer.
    const home = dwells[last]
    const before = Math.max(
      showpiece ? showpiece.flyOut.end : -Infinity,
      refillShot ? refillShot.flyOut.end : -Infinity,
    )
    const resultStart = Math.max(home.start - FLY_IN_SECONDS * pace, before + CLOSE_UP_GAP * pace)
    const resultLanded = resultStart + FLY_IN_SECONDS * pace
    const resultHeld = resultLanded + RESULT_HOLD_SECONDS * pace
    const resultShot: HeldShot = {
      flyIn: { start: resultStart, end: resultLanded },
      shot: { start: resultLanded, end: resultHeld },
      flyOut: { start: resultHeld, end: resultHeld + FLY_OUT_SECONDS * pace },
    }
    home.end = Math.max(home.end, resultShot.flyOut.end)

    return {
      legs,
      dwells,
      capacity,
      plan: planWindow,
      lead: planWindow.end,
      duration: home.end,
      probeShot,
      gatewayShot,
      mapHold,
      showpiece,
      refillShot,
      resultShot,
    }
  }

  const natural = timed(refilled, 1)
  const { refillShot, showpiece, dwells, lead } = natural
  // The refill close-up gives way: it must not run into the plan, the watering
  // close-up or the result's landing as the truck stops at the depot.
  const isCrowded =
    refillShot !== null &&
    (refillShot.flyIn.start < lead ||
      refillShot.flyOut.end + CLOSE_UP_GAP > dwells[last].start - FLY_IN_SECONDS ||
      (showpiece !== null &&
        refillShot.flyIn.start < showpiece.flyOut.end + CLOSE_UP_GAP &&
        showpiece.flyIn.start < refillShot.flyOut.end + CLOSE_UP_GAP))
  const closeUp = isCrowded ? -1 : refilled
  const unpaced = isCrowded ? timed(closeUp, 1) : natural
  return timed(closeUp, Math.min(1, MAX_TOUR_SECONDS / unpaced.duration))
}

export type CloseUpKind = 'probe' | 'gateway' | 'watering' | 'refill' | 'result'
/** What a card explains: a close-up, or the map, which holds in the slanted view. */
export type HoldKind = CloseUpKind | 'map'

export interface Hold {
  kind: HoldKind
  /** Share of the hold still to come, 1 to 0. */
  left: number
}

const holdWindows = ({
  probeShot,
  gatewayShot,
  mapHold,
  plan,
  showpiece,
  refillShot,
  resultShot,
}: TourScript) =>
  [
    probeShot &&
      gatewayShot && { kind: 'probe' as const, during: probeShot.shot, next: gatewayShot.flyIn },
    gatewayShot && {
      kind: 'gateway' as const,
      during: gatewayShot.shot,
      next: gatewayShot.flyOut,
    },
    mapHold && { kind: 'map' as const, during: mapHold, next: plan },
    showpiece && { kind: 'watering' as const, during: showpiece.watering, next: showpiece.flyOut },
    refillShot && { kind: 'refill' as const, during: refillShot.shot, next: refillShot.flyOut },
    { kind: 'result' as const, during: resultShot.shot, next: resultShot.flyOut },
  ].filter((hold) => hold !== null)

/** The close-up that holds still with its card at this time, if any. */
export function holdAt(script: TourScript, seconds: number): Hold | null {
  const hold = holdWindows(script).find(
    ({ during }) => seconds >= during.start && seconds < during.end,
  )
  if (!hold) return null
  const { start, end } = hold.during
  return { kind: hold.kind, left: 1 - (seconds - start) / (end - start) }
}

/** Where a card's button continues from: the start of the way on, or `seconds` outside a hold. */
export function afterHold(script: TourScript, seconds: number): number {
  const hold = holdWindows(script).find(
    ({ during }) => seconds >= during.start && seconds < during.end,
  )
  return hold ? hold.next.start : seconds
}

/** One step of the tour clock; it stands still while someone reads a close-up's card. */
export function nextElapsed(
  script: TourScript,
  elapsed: number,
  delta: number,
  isReading: boolean,
): number {
  if (isReading && holdAt(script, elapsed)) return elapsed
  return Math.min(script.duration, elapsed + delta)
}

export interface RelayProgress {
  /** How far the message is from the probe to the gateway, 0 to 1. */
  up: number
  /** How far it is from the gateway to the depot, 0 to 1. */
  over: number
}

/** How far the probe's message has come at this time, or null while none is under way. */
export function relayAt({ gatewayShot }: TourScript, seconds: number): RelayProgress | null {
  if (!gatewayShot) return null
  const { flyIn, toDepot } = gatewayShot
  if (seconds < flyIn.start || seconds >= toDepot.end) return null
  const within = ({ start, end }: TimeWindow) => clamp01((seconds - start) / (end - start))
  return { up: within(flyIn), over: within(toDepot) }
}

/** What the slanted camera aims at; `map` is the whole town beside the map's card. */
export type TourShot = 'plan' | 'map' | 'follow' | 'home'

export type ViewMode =
  | 'iso'
  | 'flyIn'
  | 'probing'
  | 'toGateway'
  | 'gateway'
  | 'ride'
  | 'toWatering'
  | 'watering'
  | 'refilling'
  | 'result'
  | 'flyOut'

export interface TourView {
  mode: ViewMode
  /** How far into the mode, 0 to 1; 0 for the slanted view. */
  share: number
  /** Which close-up the flights lead to or come from; null in the slanted view. */
  piece: CloseUpKind | null
}

export const ISO_VIEW: TourView = { mode: 'iso', share: 0, piece: null }

const SHOWPIECE_MODES = ['flyIn', 'ride', 'toWatering', 'watering', 'flyOut'] as const

export interface TourFrame {
  done: boolean
  /** How much of the route is drawn, 0 to 1. */
  reveal: number
  /** The leg being driven, or the one that led to the current stop. */
  leg: number
  /** Position along that leg, 0 to 1. */
  along: number
  /** Index of the stop the vehicle stands at, or -1 on the road. */
  dwell: number
  dwellShare: number
  /** Stops left behind. */
  served: number
  /** Trees the tank still waters; moves smoothly while watering and refilling. */
  tank: number
  shot: TourShot
  /** Which camera draws the picture and how far it has got. */
  view: TourView
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const smooth = (t: number) => t * t * (3 - 2 * t)
// Pulls away and brakes, but keeps most of the leg at an even pace.
const eased = (t: number) => t + (smooth(t) - t) * 0.6

const held = (shot: HeldShot | null, mode: ViewMode, piece: CloseUpKind) =>
  shot
    ? ([
        ['flyIn', shot.flyIn, piece],
        [mode, shot.shot, piece],
        ['flyOut', shot.flyOut, piece],
      ] as const)
    : []

function viewAt(
  { probeShot, gatewayShot, showpiece, refillShot, resultShot }: TourScript,
  time: number,
) {
  const windows: (readonly [ViewMode, TimeWindow, CloseUpKind])[] = [
    ...(probeShot
      ? ([
          ['flyIn', probeShot.flyIn, 'probe'],
          ['probing', probeShot.shot, 'probe'],
        ] as const)
      : []),
    // The camera goes over from the probe with the message instead of flying down.
    ...held(gatewayShot, 'gateway', 'gateway').map(
      ([mode, window, piece]) => [mode === 'flyIn' ? 'toGateway' : mode, window, piece] as const,
    ),
    ...SHOWPIECE_MODES.flatMap((mode) => {
      const window = showpiece?.[mode]
      return window ? [[mode, window, 'watering'] as const] : []
    }),
    ...held(refillShot, 'refilling', 'refill'),
    ...held(resultShot, 'result', 'result'),
  ]
  const now = windows.find(([, { start, end }]) => time >= start && time < end)
  if (!now) return ISO_VIEW
  const [mode, { start, end }, piece] = now
  return { mode, share: (time - start) / (end - start), piece } satisfies TourView
}

export function tourFrame(script: TourScript, seconds: number): TourFrame {
  const time = Math.min(script.duration, Math.max(0, seconds))
  const last = script.legs.length - 1
  const base = {
    done: false,
    reveal: clamp01((time - script.plan.start) / (script.plan.end - script.plan.start)),
    view: viewAt(script, time),
  }

  if (time >= script.duration) {
    return {
      ...base,
      done: true,
      leg: last,
      along: 1,
      dwell: last,
      dwellShare: 1,
      served: script.dwells.length,
      tank: script.dwells[last].stop.leftWith,
      shot: 'home',
      view: ISO_VIEW,
    }
  }

  if (time < script.lead) {
    return {
      ...base,
      leg: 0,
      along: 0,
      dwell: -1,
      dwellShare: 0,
      served: 0,
      tank: script.capacity,
      // The slanted camera makes room for the map's card while the probe's
      // close-up hides it, so the flight back from the gateway lands there.
      shot: script.probeShot && time >= script.probeShot.shot.start ? 'map' : 'plan',
    }
  }

  let index = 0
  while (index < last && time >= script.dwells[index].end) index++
  const leg = script.legs[index]
  const dwell = script.dwells[index]

  if (time < leg.end) {
    const share = (time - leg.start) / (leg.end - leg.start)
    const along = leg.drive
      ? drivenDistance(leg.drive, share * leg.drive.duration) / leg.length
      : eased(share)
    return {
      ...base,
      leg: index,
      along: Math.min(1, along),
      dwell: -1,
      dwellShare: 0,
      served: index,
      tank: dwell.stop.arrivedWith,
      shot: 'follow',
    }
  }

  const share = clamp01((time - dwell.start) / (dwell.end - dwell.start))
  return {
    ...base,
    leg: index,
    along: 1,
    dwell: index,
    dwellShare: share,
    served: index,
    tank: dwell.stop.arrivedWith + (dwell.stop.leftWith - dwell.stop.arrivedWith) * smooth(share),
    // Back at the depot the slanted camera goes to the whole town while the
    // close-up of the result draws, so the fly-out lands on the overview.
    shot: index === last ? 'home' : 'follow',
  }
}
