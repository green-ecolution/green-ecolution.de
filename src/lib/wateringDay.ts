import { pathLength, roundedPath, type GroundPoint } from './storyPath'
import type { Plan, PlanStop } from './wateringPlan'

/** Road units per second. */
export const CRUISE = 24
/** The leg the camera rides along is driven slower, so the ride lasts. */
export const POV_CRUISE = 13
export const PLAN_SECONDS = 1.1
export const WATER_SECONDS = 1.2
export const REFILL_SECONDS = 1.4
export const MAX_TOUR_SECONDS = 22
export const CORNER_RADIUS = 3.5
export const POV_SECONDS = 2.6
export const POV_MIN_SECONDS = 1.5
const POV_LEAD_IN = 0.3
const POV_LEAD_OUT = 0.45
export const CUT_SECONDS = 0.08
/** Share of the way home after which the camera pulls back to the whole town. */
const HOME_FROM = 0.55

export interface TourLeg {
  path: GroundPoint[]
  length: number
  start: number
  end: number
}

export interface TourDwell {
  stop: PlanStop
  start: number
  end: number
}

export interface TourScript {
  /** legs[i] ends at dwells[i]; the last dwell is the arrival at the depot. */
  legs: TourLeg[]
  dwells: TourDwell[]
  capacity: number
  /** When the first leg starts; until then the route draws itself. */
  lead: number
  duration: number
  pov: { start: number; end: number } | null
}

const dwellSeconds = (stop: PlanStop) =>
  stop.kind === 'tree' ? WATER_SECONDS : stop.kind === 'refill' ? REFILL_SECONDS : 0

export function tourScript(
  plan: Plan,
  pathBetween: (from: number, to: number) => GroundPoint[],
  depot: number,
  capacity: number,
): TourScript {
  if (plan.stops.length === 0) throw new Error('a tour needs at least one stop')
  const paths = plan.stops.map((stop, index) =>
    roundedPath(
      pathBetween(index === 0 ? depot : plan.stops[index - 1].site, stop.site),
      CORNER_RADIUS,
    ),
  )
  const lengths = paths.map(pathLength)

  // The ride ends where a tree gets watered, so the cut out of it lands on the stop.
  let ride = -1
  plan.stops.forEach((stop, index) => {
    if (stop.kind === 'tree' && (ride < 0 || lengths[index] > lengths[ride])) ride = index
  })
  const wanted = POV_LEAD_IN + POV_SECONDS + POV_LEAD_OUT
  const driving = lengths.map((length, index) =>
    index === ride
      ? Math.max(length / CRUISE, Math.min(length / POV_CRUISE, wanted))
      : length / CRUISE,
  )

  const natural =
    PLAN_SECONDS +
    driving.reduce((sum, seconds) => sum + seconds, 0) +
    plan.stops.reduce((sum, stop) => sum + dwellSeconds(stop), 0)
  const pace = Math.min(1, MAX_TOUR_SECONDS / natural)

  const legs: TourLeg[] = []
  const dwells: TourDwell[] = []
  let clock = PLAN_SECONDS * pace
  plan.stops.forEach((stop, index) => {
    const start = clock
    clock += driving[index] * pace
    legs.push({ path: paths[index], length: lengths[index], start, end: clock })
    const arrived = clock
    clock += dwellSeconds(stop) * pace
    dwells.push({ stop, start: arrived, end: clock })
  })

  let pov: TourScript['pov'] = null
  if (ride >= 0) {
    const leg = legs[ride]
    const end = leg.end - POV_LEAD_OUT
    const start = Math.max(leg.start + POV_LEAD_IN, end - POV_SECONDS)
    if (end - start >= POV_MIN_SECONDS) pov = { start, end }
  }

  return { legs, dwells, capacity, lead: PLAN_SECONDS * pace, duration: clock, pov }
}

export type TourShot = 'plan' | 'follow' | 'pov' | 'water' | 'refill' | 'home'

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
  /** How far the picture is dimmed for the cut into or out of the ride, 0 to 1. */
  cut: number
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const smooth = (t: number) => t * t * (3 - 2 * t)
// Pulls away and brakes, but keeps most of the leg at an even pace.
const eased = (t: number) => t + (smooth(t) - t) * 0.6

export function tourFrame(script: TourScript, seconds: number): TourFrame {
  const time = Math.min(script.duration, Math.max(0, seconds))
  const last = script.legs.length - 1
  const cut = script.pov
    ? Math.max(
        clamp01(1 - Math.abs(time - script.pov.start) / CUT_SECONDS),
        clamp01(1 - Math.abs(time - script.pov.end) / CUT_SECONDS),
      )
    : 0
  const base = { done: false, reveal: clamp01(time / script.lead), cut }

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
    const riding = script.pov !== null && time >= script.pov.start && time < script.pov.end
    return {
      ...base,
      leg: index,
      along: eased(share),
      dwell: -1,
      dwellShare: 0,
      served: index,
      tank: dwell.stop.arrivedWith,
      shot: riding ? 'pov' : index === last && share >= HOME_FROM ? 'home' : 'follow',
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
    shot: dwell.stop.kind === 'refill' ? 'refill' : 'water',
  }
}
