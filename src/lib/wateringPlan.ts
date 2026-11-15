export interface PlanInput {
  distance: (from: number, to: number) => number
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
}

export interface PlanStop {
  site: number
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
 * The shortest tour that waters every thirsty tree without running dry. The
 * order of the trees and the refills are decided together: a state is the set
 * of watered trees, the place and the tank level.
 */
export function planWatering(input: PlanInput): Plan {
  const { distance, depot, thirsty, capacity, refillCost } = input
  const trees = thirsty.length
  if (trees > MAX_TREES) throw new Error(`a tour takes at most ${MAX_TREES} trees`)
  if (capacity < 1) throw new Error('the tank has to water at least one tree')
  if (trees === 0) return { stops: [], length: 0 }

  const water = [depot, ...input.hydrants]
  const places = [...thirsty, ...water]
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
  cost[id(0, trees, capacity)] = 0
  const full = (1 << trees) - 1

  for (let mask = 0; mask <= full; mask++) {
    // Every tree state of this mask is final by now, so the refills go first:
    // they stay within the mask and feed the steps to the next trees.
    for (let place = 0; place < trees; place++) {
      for (let level = 0; level < capacity; level++) {
        const state = id(mask, place, level)
        if (cost[state] === Infinity) continue
        for (let point = 0; point < water.length; point++) {
          reach(
            id(mask, trees + point, capacity),
            state,
            cost[state] + distance(places[place], water[point]) + refillCost,
          )
        }
      }
    }

    for (let place = 0; place < places.length; place++) {
      for (let level = 1; level <= capacity; level++) {
        const state = id(mask, place, level)
        if (cost[state] === Infinity) continue
        for (let tree = 0; tree < trees; tree++) {
          if (mask & (1 << tree)) continue
          reach(
            id(mask | (1 << tree), tree, level - 1),
            state,
            cost[state] + distance(places[place], places[tree]),
          )
        }
      }
    }
  }

  let last = -1
  let best = Infinity
  for (let place = 0; place < trees; place++) {
    for (let level = 0; level <= capacity; level++) {
      const state = id(full, place, level)
      const total = cost[state] + distance(places[place], depot)
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
  let at = depot
  for (const { place, level } of visits) {
    const site = places[place]
    length += distance(at, site)
    stops.push({
      site,
      kind: place < trees ? 'tree' : 'refill',
      arrivedWith: tank,
      leftWith: level,
    })
    tank = level
    at = site
  }
  length += distance(at, depot)
  stops.push({ site: depot, kind: 'depot', arrivedWith: tank, leftWith: tank })

  return { stops, length }
}
