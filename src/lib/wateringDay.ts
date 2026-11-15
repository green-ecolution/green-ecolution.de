import { pathLength, roundedPath, type GroundPoint } from './storyPath'
import type { Plan, PlanStop } from './wateringPlan'

/** Road units per second. */
export const CRUISE = 15
/** The truck slows to this as the camera comes down to the seat, so the ride is calm. */
export const RIDE_CRUISE = 5.5
export const PLAN_SECONDS = 1.6
export const WATER_SECONDS = 2.2
export const REFILL_SECONDS = 2.6
export const MAX_TOUR_SECONDS = 70
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
/** How long the watering shot and the refill close-up hold still while their card explains them. */
export const WATERING_HOLD_SECONDS = 8
export const REFILL_HOLD_SECONDS = 9
/** The slanted view between the two close-ups lasts at least this long. */
const CLOSE_UP_GAP = 1.5
/** Share of the way home after which the camera pulls back to the whole town. */
const HOME_FROM = 0.55

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

/** The close-up at the hydrant: down as the truck stops, back up as it drives on. */
export interface RefillShot {
  /** Index of the refill stop in `dwells`. */
  stop: number
  flyIn: TimeWindow
  shot: TimeWindow
  flyOut: TimeWindow
}

export interface TourScript {
  /** legs[i] ends at dwells[i]; the last dwell is the arrival at the depot. */
  legs: TourLeg[]
  dwells: TourDwell[]
  capacity: number
  /** When the first leg starts; until then the route draws itself. */
  lead: number
  duration: number
  showpiece: Showpiece | null
  refillShot: RefillShot | null
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

  const timed = (closeUp: number) => {
    const standing = plan.stops.map((stop, index): number =>
      index === ridden
        ? (isRidden ? TO_WATERING_SECONDS : 0) + WATERING_HOLD_SECONDS + FLY_OUT_EARLY
        : index === closeUp
          ? REFILL_HOLD_SECONDS + FLY_OUT_EARLY
          : dwellSeconds(stop),
    )
    const natural =
      PLAN_SECONDS +
      driving.reduce((sum, seconds) => sum + seconds, 0) +
      standing.reduce((sum, seconds) => sum + seconds, 0)
    const pace = Math.min(1, MAX_TOUR_SECONDS / natural)

    const legs: TourLeg[] = []
    const dwells: TourDwell[] = []
    let clock = PLAN_SECONDS * pace
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
        const flyInStart = Math.max(PLAN_SECONDS * pace, stop.start - FLY_IN_SECONDS * pace)
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

    return {
      legs,
      dwells,
      capacity,
      lead: PLAN_SECONDS * pace,
      duration: clock,
      showpiece,
      refillShot,
    }
  }

  const script = timed(refilled)
  const { refillShot, showpiece, lead } = script
  // The two close-ups must not run into each other, nor into the plan.
  const isCrowded =
    refillShot !== null &&
    (refillShot.flyIn.start < lead ||
      (showpiece !== null &&
        refillShot.flyIn.start < showpiece.flyOut.end + CLOSE_UP_GAP &&
        showpiece.flyIn.start < refillShot.flyOut.end + CLOSE_UP_GAP))
  return isCrowded ? timed(-1) : script
}

export interface Hold {
  kind: 'watering' | 'refill'
  /** Share of the hold still to come, 1 to 0. */
  left: number
}

const holdWindows = ({ showpiece, refillShot }: TourScript) =>
  [
    showpiece && { kind: 'watering' as const, during: showpiece.watering, next: showpiece.flyOut },
    refillShot && { kind: 'refill' as const, during: refillShot.shot, next: refillShot.flyOut },
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

/** Where „Weiterfahren“ continues from: the start of the fly-out, or `seconds` outside a hold. */
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

/** What the slanted camera aims at. */
export type TourShot = 'plan' | 'follow' | 'home'

export type ViewMode = 'iso' | 'flyIn' | 'ride' | 'toWatering' | 'watering' | 'refilling' | 'flyOut'

export interface TourView {
  mode: ViewMode
  /** How far into the mode, 0 to 1; 0 for the slanted view. */
  share: number
  /** Which close-up the flights lead to or come from; null in the slanted view. */
  piece: 'watering' | 'refill' | null
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

function viewAt({ showpiece, refillShot }: TourScript, time: number): TourView {
  const windows: (readonly [ViewMode, TimeWindow, TourView['piece']])[] = [
    ...SHOWPIECE_MODES.flatMap((mode) => {
      const window = showpiece?.[mode]
      return window ? [[mode, window, 'watering'] as const] : []
    }),
    ...(refillShot
      ? ([
          ['flyIn', refillShot.flyIn, 'refill'],
          ['refilling', refillShot.shot, 'refill'],
          ['flyOut', refillShot.flyOut, 'refill'],
        ] as const)
      : []),
  ]
  const now = windows.find(([, { start, end }]) => time >= start && time < end)
  if (!now) return ISO_VIEW
  const [mode, { start, end }, piece] = now
  return { mode, share: (time - start) / (end - start), piece }
}

export function tourFrame(script: TourScript, seconds: number): TourFrame {
  const time = Math.min(script.duration, Math.max(0, seconds))
  const last = script.legs.length - 1
  const base = {
    done: false,
    reveal: clamp01(time / script.lead),
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
      shot: 'plan',
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
      shot: index === last && share >= HOME_FROM ? 'home' : 'follow',
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
    shot: 'follow',
  }
}
