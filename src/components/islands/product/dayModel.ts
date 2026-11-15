import {
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
import { tourScript, type TourScript } from '../../../lib/wateringDay'
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
export const NOT_STARTED: TourProgress = { served: 0, dwell: -1, done: false }

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
    distance: townGraph.distance,
    depot: DEPOT_SITE,
    hydrants: [HYDRANT_SITE],
    thirsty,
    capacity: TANK_CAPACITY,
    refillCost: REFILL_COST,
  })

  const order = townTrees.map(() => 0)
  let treeStops = 0
  for (const stop of plan.stops) {
    if (stop.kind === 'tree') order[treeOfSite(stop.site)] = ++treeStops
  }

  return {
    script: tourScript(plan, townGraph.path, DEPOT_SITE, TANK_CAPACITY),
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
})

/** The tank as the gauge shows it between stops, 0 to 1. */
export function tankShare(day: PlannedDay | null, progress: TourProgress): number {
  if (!day || progress.served === 0) return 1
  return day.script.dwells[progress.served - 1].stop.leftWith / day.script.capacity
}

export interface StatusText {
  /** Key in the product catalog. */
  key: string
  vars?: Record<string, number>
  /** The tree the text names; the island fills in `{{name}}`. */
  tree?: TreeId
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

  if (phase === 'done') {
    const rest = townTrees.length - day.treeStops
    return day.treeStops === 1
      ? { key: 'day.status.doneOne', vars: { rest } }
      : { key: 'day.status.done', vars: { watered: day.treeStops, rest } }
  }

  const { dwells } = day.script

  if (progress.dwell >= 0) {
    const { stop } = dwells[progress.dwell]
    if (stop.kind === 'tree') {
      return { key: 'day.status.watering', tree: townTrees[treeOfSite(stop.site)].id }
    }
    if (stop.site === DEPOT_SITE) return { key: 'day.status.refillDepot' }
    return { key: stop.arrivedWith > 0 ? 'day.status.topUp' : 'day.status.refill' }
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
