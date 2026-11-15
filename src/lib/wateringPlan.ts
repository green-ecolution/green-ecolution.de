export interface PlanInput {
  /** The ways a site can be arrived at; a stop is always left the way the truck faces. */
  arrivals: (site: number) => readonly number[]
  /** Road from standing at the end of one arrival to standing at the end of another. */
  distance: (fromArc: number, toArc: number) => number
  /** Site the tour starts and ends at; it is a water point as well. */
  depot: number
  /** Further sites to refill at. */
  hydrants: readonly number[]
  /** Sites of the trees that need water, at most MAX_TREES. */
  thirsty: readonly number[]
  /** Trees one tank waters. */
  capacity: number
  /** What a refill stop costs, as a length of road. */
  refillCost: number
  /**
   * How thirsty a tree is, 0 to 1. Among tours of the same length the one that
   * waters the thirstier trees earlier wins; it never makes a tour longer.
   */
  urgency?: (site: number) => number
}

export interface PlanStop {
  site: number
  /** The arrival the truck stands on there. */
  arc: number
  kind: 'tree' | 'refill' | 'depot'
  /** Trees the tank still waters on arrival. */
  arrivedWith: number
  /** And when leaving. */
  leftWith: number
}

export interface Plan {
  /** In the order they are driven; the last one is the depot. */
  stops: PlanStop[]
  /** Road length of the whole tour, refill costs not included. */
  length: number
}

export const MAX_TREES = 12

/**
 * Weight of the urgency tie-break per tree watered before. It has to stay far
 * below the smallest real difference between two tours: with twelve trees it
 * adds at most 0.066 units of road.
 */
const URGENCY_WEIGHT = 1e-3

interface Place {
  site: number
  arc: number
  /** Index in `thirsty`, or -1 for a water point. */
  tree: number
}

const treesIn = (mask: number) => {
  let count = 0
  for (let rest = mask; rest; rest &= rest - 1) count++
  return count
}

/**
 * The shortest tour that waters every thirsty tree without running dry. The
 * order of the trees and the refills are decided together: a state is the set
 * of watered trees, the place and the tank level. A place is a site together
 * with the way the truck arrived there, so no stop is left by turning round.
 */
export function planWatering(input: PlanInput): Plan {
  const { arrivals, distance, depot, thirsty, capacity, refillCost } = input
  const urgency = input.urgency ?? (() => 0)
  const trees = thirsty.length
  if (trees > MAX_TREES) throw new Error(`a tour takes at most ${MAX_TREES} trees`)
  if (capacity < 1) throw new Error('the tank has to water at least one tree')
  if (trees === 0) return { stops: [], length: 0 }

  const places: Place[] = thirsty.flatMap((site, tree) =>
    arrivals(site).map((arc) => ({ site, arc, tree })),
  )
  const firstWater = places.length
  for (const site of [depot, ...input.hydrants]) {
    for (const arc of arrivals(site)) places.push({ site, arc, tree: -1 })
  }
  const home = places.findIndex((place) => place.site === depot)
  const homeArc = places[home].arc

  const levels = capacity + 1
  const perMask = places.length * levels
  const size = (1 << trees) * perMask
  const cost = new Float64Array(size).fill(Infinity)
  const cameFrom = new Int32Array(size).fill(-1)
  const id = (mask: number, place: number, level: number) => mask * perMask + place * levels + level

  const reach = (state: number, from: number, total: number) => {
    if (total < cost[state]) {
      cost[state] = total
      cameFrom[state] = from
    }
  }

  // The tour starts at the depot with a full tank and nothing watered.
  cost[id(0, home, capacity)] = 0
  const full = (1 << trees) - 1

  for (let mask = 0; mask <= full; mask++) {
    // Every tree state of this mask is final by now, so the refills go first:
    // they stay within the mask and feed the steps to the next trees.
    for (let place = 0; place < firstWater; place++) {
      for (let level = 0; level < capacity; level++) {
        const state = id(mask, place, level)
        if (cost[state] === Infinity) continue
        for (let point = firstWater; point < places.length; point++) {
          reach(
            id(mask, point, capacity),
            state,
            cost[state] + distance(places[place].arc, places[point].arc) + refillCost,
          )
        }
      }
    }

    const before = treesIn(mask) * URGENCY_WEIGHT
    for (let place = 0; place < places.length; place++) {
      for (let level = 1; level <= capacity; level++) {
        const state = id(mask, place, level)
        if (cost[state] === Infinity) continue
        for (let next = 0; next < firstWater; next++) {
          const { tree, site, arc } = places[next]
          if (mask & (1 << tree)) continue
          reach(
            id(mask | (1 << tree), next, level - 1),
            state,
            cost[state] + distance(places[place].arc, arc) + before * urgency(site),
          )
        }
      }
    }
  }

  let last = -1
  let best = Infinity
  for (let place = 0; place < firstWater; place++) {
    for (let level = 0; level <= capacity; level++) {
      const state = id(full, place, level)
      const total = cost[state] + distance(places[place].arc, homeArc)
      if (total < best) {
        best = total
        last = state
      }
    }
  }

  const visits: { place: number; level: number }[] = []
  for (let state = last; cameFrom[state] >= 0; state = cameFrom[state]) {
    const within = state % perMask
    visits.unshift({ place: Math.floor(within / levels), level: within % levels })
  }

  const stops: PlanStop[] = []
  let tank = capacity
  let length = 0
  let at = homeArc
  for (const { place, level } of visits) {
    const { site, arc, tree } = places[place]
    length += distance(at, arc)
    stops.push({
      site,
      arc,
      kind: tree >= 0 ? 'tree' : 'refill',
      arrivedWith: tank,
      leftWith: level,
    })
    tank = level
    at = arc
  }
  length += distance(at, homeArc)
  stops.push({ site: depot, arc: homeArc, kind: 'depot', arrivedWith: tank, leftWith: tank })

  return { stops, length }
}
