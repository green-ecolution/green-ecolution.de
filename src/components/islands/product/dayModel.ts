import {
  DEPOT_ARC,
  DEPOT_SITE,
  HYDRANT_SITE,
  REFILL_COST,
  TANK_CAPACITY,
  siteOfTree,
  townGraph,
  townTrees,
  treeOfSite,
  type TreeId,
} from '../../../data/productTown'
import { moisture, thirst, type Thirst } from '../../../lib/dryness'
import { tourScript, type CloseUpKind, type TourScript } from '../../../lib/wateringDay'
import { planWatering } from '../../../lib/wateringPlan'
import type { TourProgress } from './shared'

export type DayPhase = 'idle' | 'touring' | 'done'

// The colours of the pins in the scene (pinColors in storyTown), repeated here
// so the panel does not pull the home page's town into its bundle.
export const thirstColors: Record<Thirst, string> = {
  dry: '#E5484D',
  soon: '#F2C230',
  ok: '#4CAF50',
}

export const NOT_WATERED: boolean[] = townTrees.map(() => false)
export const NO_ORDER: number[] = townTrees.map(() => 0)
export const NOT_STARTED: TourProgress = { served: 0, dwell: -1, done: false, routed: false }

export interface TreeRow {
  /** Index in townTrees. */
  index: number
  id: TreeId
  level: number
  state: Thirst
  watered: boolean
  /** Number on the planned tour, 0 if the tree is not on it. */
  order: number
}

/** The trees as the list shows them, the driest first. */
export function treeRows(days: number, watered: boolean[], order: number[]): TreeRow[] {
  return townTrees
    .map((tree, index) => {
      const level = watered[index] ? 1 : moisture(tree.rate, days)
      return {
        index,
        id: tree.id,
        level,
        state: thirst(level),
        watered: watered[index],
        order: order[index],
      }
    })
    .sort((a, b) => a.level - b.level || a.index - b.index)
}

export interface PlannedDay {
  script: TourScript
  /** Per tree in townTrees: its number on the tour, 0 if it is not on it. */
  order: number[]
  treeStops: number
  refills: number
}

export function planDay(days: number): PlannedDay | null {
  const thirsty = townTrees
    .map((tree, index) => ({ index, state: thirst(moisture(tree.rate, days)) }))
    .filter((tree) => tree.state === 'dry')
    .map((tree) => siteOfTree(tree.index))
  if (thirsty.length === 0) return null

  const plan = planWatering({
    arrivals: townGraph.arrivals,
    distance: townGraph.distance,
    depot: DEPOT_SITE,
    hydrants: [HYDRANT_SITE],
    thirsty,
    capacity: TANK_CAPACITY,
    refillCost: REFILL_COST,
    urgency: (site) => 1 - moisture(townTrees[treeOfSite(site)].rate, days),
  })

  const order = townTrees.map(() => 0)
  let treeStops = 0
  for (const stop of plan.stops) {
    if (stop.kind === 'tree') order[treeOfSite(stop.site)] = ++treeStops
  }

  return {
    script: tourScript(plan, townGraph.path, { site: DEPOT_SITE, arc: DEPOT_ARC }, TANK_CAPACITY),
    order,
    treeStops,
    refills: plan.stops.filter((stop) => stop.kind === 'refill').length,
  }
}

export function wateredAfter(script: TourScript, served: number): boolean[] {
  const watered = townTrees.map(() => false)
  for (const { stop } of script.dwells.slice(0, served)) {
    if (stop.kind === 'tree') watered[treeOfSite(stop.site)] = true
  }
  return watered
}

export const finished = (script: TourScript): TourProgress => ({
  served: script.dwells.length,
  dwell: script.dwells.length - 1,
  done: true,
  routed: true,
})

/** The tank as the gauge shows it between stops, 0 to 1. */
export function tankShare(day: PlannedDay | null, progress: TourProgress): number {
  if (!day || progress.served === 0) return 1
  return day.script.dwells[progress.served - 1].stop.leftWith / day.script.capacity
}

export const STATUS_KEYS = [
  'day.status.none',
  'day.status.thirstyOne',
  'day.status.thirstyMany',
  'day.status.reporting',
  'day.status.plannedOne',
  'day.status.planned',
  'day.status.plannedRefill',
  'day.status.watering',
  'day.status.next',
  'day.status.toWater',
  'day.status.topUp',
  'day.status.refill',
  'day.status.refillDepot',
  'day.status.home',
  'day.status.doneOne',
  'day.status.done',
] as const

export type StatusKey = (typeof STATUS_KEYS)[number]

export interface StatusText {
  key: StatusKey
  vars?: Record<string, number>
  /** The tree the text names; the island fills in `{{name}}`. */
  tree?: TreeId
}

function resultVars(day: PlannedDay): Record<string, number> {
  const rest = townTrees.length - day.treeStops
  return day.treeStops === 1 ? { rest } : { watered: day.treeStops, rest }
}

export function dayStatus(
  phase: DayPhase,
  rows: TreeRow[],
  day: PlannedDay | null,
  progress: TourProgress,
): StatusText {
  if (phase === 'idle' || !day) {
    const count = rows.filter((row) => row.state === 'dry').length
    if (count === 0) return { key: 'day.status.none' }
    return count === 1
      ? { key: 'day.status.thirstyOne' }
      : { key: 'day.status.thirstyMany', vars: { count } }
  }

  const { dwells } = day.script
  // The result is in from the arrival at the depot, while its close-up still holds.
  const isHome = progress.dwell >= 0 && dwells[progress.dwell].stop.kind === 'depot'
  if (phase === 'done' || isHome) {
    return {
      key: day.treeStops === 1 ? 'day.status.doneOne' : 'day.status.done',
      vars: resultVars(day),
    }
  }

  if (progress.dwell >= 0) {
    const { stop } = dwells[progress.dwell]
    if (stop.kind === 'tree') {
      return { key: 'day.status.watering', tree: townTrees[treeOfSite(stop.site)].id }
    }
    if (stop.site === DEPOT_SITE) return { key: 'day.status.refillDepot' }
    return { key: stop.arrivedWith > 0 ? 'day.status.topUp' : 'day.status.refill' }
  }

  // Before the route draws, the probe at the first tree reports and its message travels.
  const first = dwells.find(({ stop }) => stop.kind === 'tree')
  if (progress.served === 0 && !progress.routed && first) {
    return { key: 'day.status.reporting', tree: townTrees[treeOfSite(first.stop.site)].id }
  }

  if (progress.served === 0) {
    if (day.treeStops === 1) return { key: 'day.status.plannedOne' }
    return {
      key: day.refills > 0 ? 'day.status.plannedRefill' : 'day.status.planned',
      vars: { count: day.treeStops },
    }
  }

  const next = dwells[Math.min(progress.served, dwells.length - 1)].stop
  if (next.kind === 'tree') {
    return { key: 'day.status.next', tree: townTrees[treeOfSite(next.site)].id }
  }
  return { key: next.kind === 'refill' ? 'day.status.toWater' : 'day.status.home' }
}

export const CARD_KEYS = [
  'day.info.probe.label',
  'day.info.probe.title',
  'day.info.probe.text',
  'day.info.probe.next',
  'day.info.gateway.label',
  'day.info.gateway.title',
  'day.info.gateway.text',
  'day.info.watering.label',
  'day.info.watering.title',
  'day.info.watering.text',
  'day.info.refill.label',
  'day.info.refill.title',
  'day.info.refill.text',
  'day.info.done.label',
  'day.info.done.title',
  'day.info.done.text',
  'day.info.done.textOne',
  'day.info.next',
  'day.tour.again',
] as const

type CardKey = (typeof CARD_KEYS)[number]

export interface CardCopy {
  label: CardKey
  title: CardKey
  text: { key: CardKey; vars?: Record<string, number> }
  /** The button's label. */
  next: CardKey
  /** Whether the screen reader hears the text too, or the title alone. */
  announcesText: boolean
}

/** Catalog keys of the card that explains a close-up while it holds. */
export function holdCopy(kind: CloseUpKind, day: PlannedDay | null): CardCopy {
  const section = kind === 'result' ? 'done' : kind
  const keys = {
    label: `day.info.${section}.label`,
    title: `day.info.${section}.title`,
  } as const
  if (kind === 'result') {
    // Without the counts the card would show its placeholders.
    if (!day) throw new Error('the result card needs the day it counts')
    return {
      ...keys,
      text: {
        key: day.treeStops === 1 ? 'day.info.done.textOne' : 'day.info.done.text',
        vars: resultVars(day),
      },
      next: 'day.tour.again',
      // The status line announces the same counts as the truck arrives.
      announcesText: false,
    }
  }
  return {
    ...keys,
    text: { key: `day.info.${section}.text` as const },
    // The truck has not left yet, so it cannot drive on.
    next: kind === 'probe' || kind === 'gateway' ? 'day.info.probe.next' : 'day.info.next',
    announcesText: true,
  }
}
