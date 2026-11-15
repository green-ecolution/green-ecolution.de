import { describe, expect, it } from 'vitest'
import { roadGraph, type Street } from './roadGraph'
import { MAX_TREES, planWatering, type Plan, type PlanInput } from './wateringPlan'

/** In the line and plane worlds a site is reached one way only, so the site is its own arc. */
const oneWay = (site: number) => [site]

/** Sites on a straight road; the index is the site. */
const line = (at: number[]) => (from: number, to: number) => Math.abs(at[from] - at[to])

/** Sites on a plane, as the crow flies. */
const plane = (at: [number, number][]) => (from: number, to: number) =>
  Math.hypot(at[from][0] - at[to][0], at[from][1] - at[to][1])

function kinds(plan: Plan) {
  return plan.stops.map((stop) => stop.kind)
}

// What a driver does without a plan: the nearest thirsty tree while there is
// water, the nearest water point once the tank is empty.
function emptyFirst(input: PlanInput): number {
  const water = [input.depot, ...input.hydrants]
  const left = new Set(input.thirsty)
  let at = input.depot
  let tank = input.capacity
  let length = 0

  while (left.size > 0) {
    const pool = tank > 0 ? [...left] : water
    const target = pool.reduce((best, site) =>
      input.distance(at, site) < input.distance(at, best) ? site : best,
    )
    length += input.distance(at, target)
    at = target
    if (tank > 0) {
      left.delete(target)
      tank--
    } else {
      tank = input.capacity
    }
  }

  return length + input.distance(at, input.depot)
}

describe('planWatering', () => {
  it('plant keine Tour, wenn kein Baum Wasser braucht', () => {
    const plan = planWatering({
      arrivals: oneWay,
      distance: line([0, 5]),
      depot: 0,
      hydrants: [1],
      thirsty: [],
      capacity: 4,
      refillCost: 1,
    })
    expect(plan).toEqual({ stops: [], length: 0 })
  })

  it('kommt bei einer kleinen Tour ohne Nachfüllen aus', () => {
    // depot at 0, hydrant at 5, trees at 2 and 4
    const plan = planWatering({
      arrivals: oneWay,
      distance: line([0, 5, 2, 4]),
      depot: 0,
      hydrants: [1],
      thirsty: [2, 3],
      capacity: 4,
      refillCost: 1,
    })
    expect(kinds(plan)).toEqual(['tree', 'tree', 'depot'])
    expect(plan.length).toBeCloseTo(8)
    expect(plan.stops.at(-1)).toMatchObject({ site: 0, arrivedWith: 2, leftWith: 2 })
  })

  it('füllt unterwegs auf, obwohl der Tank noch nicht leer ist', () => {
    // depot at 0, hydrant at 3, trees at 1, 2, 4, 5 and 6. One tank waters four.
    // Running dry first would mean driving back to the hydrant from beyond it.
    const plan = planWatering({
      arrivals: oneWay,
      distance: line([0, 3, 1, 2, 4, 5, 6]),
      depot: 0,
      hydrants: [1],
      thirsty: [2, 3, 4, 5, 6],
      capacity: 4,
      refillCost: 1,
    })
    const refills = plan.stops.filter((stop) => stop.kind === 'refill')
    expect(plan.length).toBeCloseTo(12)
    expect(refills).toHaveLength(1)
    expect(refills[0].site).toBe(1)
    expect(refills[0].arrivedWith).toBeGreaterThan(0)
    expect(refills[0].leftWith).toBe(4)
  })

  it('füllt am Depot nach, wenn es die nächste Wasserstelle ist', () => {
    // trees on both sides of the depot, one tank waters two
    const plan = planWatering({
      arrivals: oneWay,
      distance: line([0, 1, 2, -1, -2]),
      depot: 0,
      hydrants: [],
      thirsty: [1, 2, 3, 4],
      capacity: 2,
      refillCost: 1,
    })
    expect(kinds(plan)).toEqual(['tree', 'tree', 'refill', 'tree', 'tree', 'depot'])
    expect(plan.stops[2].site).toBe(0)
    expect(plan.length).toBeCloseTo(8)
  })

  it('gießt jeden Baum genau einmal und fährt nie mit leerem Tank an einen Baum', () => {
    const at: [number, number][] = [
      [0, 0],
      [9, 2],
      [3, 4],
      [7, 7],
      [1, 8],
      [5, 1],
      [8, 5],
      [2, 2],
      [6, 9],
    ]
    const thirsty = [2, 3, 4, 5, 6, 7, 8]
    const plan = planWatering({
      arrivals: oneWay,
      distance: plane(at),
      depot: 0,
      hydrants: [1],
      thirsty,
      capacity: 3,
      refillCost: 0.5,
    })
    const watered = plan.stops.filter((stop) => stop.kind === 'tree').map((stop) => stop.site)

    expect([...watered].sort()).toEqual(thirsty)
    for (const stop of plan.stops) {
      if (stop.kind === 'tree') {
        expect(stop.arrivedWith).toBeGreaterThanOrEqual(1)
        expect(stop.leftWith).toBe(stop.arrivedWith - 1)
      }
      if (stop.kind === 'refill') expect(stop.leftWith).toBe(3)
    }
    expect(plan.stops.at(-1)?.kind).toBe('depot')
  })

  it('ist nie länger als erst leerfahren und dann auffüllen', () => {
    // A small generator with a fixed seed keeps the towns the same on every run.
    let seed = 7
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }

    for (let town = 0; town < 25; town++) {
      const at = Array.from({ length: 10 }, (): [number, number] => [random() * 40, random() * 40])
      const input: PlanInput = {
        arrivals: oneWay,
        distance: plane(at),
        depot: 0,
        hydrants: [1],
        thirsty: [2, 3, 4, 5, 6, 7, 8, 9],
        capacity: 3,
        refillCost: 0,
      }
      expect(planWatering(input).length).toBeLessThanOrEqual(emptyFirst(input) + 1e-9)
    }
  })

  it('rechnet zwölf Bäume durch, ohne das Zeitlimit des Tests zu reißen', () => {
    const at = Array.from({ length: 14 }, (_, index): [number, number] => [
      (index * 37) % 23,
      (index * 53) % 19,
    ])
    const thirsty = Array.from({ length: MAX_TREES }, (_, index) => index + 2)
    const plan = planWatering({
      arrivals: oneWay,
      distance: plane(at),
      depot: 0,
      hydrants: [1],
      thirsty,
      capacity: 4,
      refillCost: 1,
    })
    expect(plan.stops.filter((stop) => stop.kind === 'tree')).toHaveLength(MAX_TREES)
  })

  it('lehnt mehr Bäume ab, als es durchrechnen kann', () => {
    const thirsty = Array.from({ length: MAX_TREES + 1 }, (_, index) => index + 1)
    expect(() =>
      planWatering({
        arrivals: oneWay,
        distance: () => 1,
        depot: 0,
        hydrants: [],
        thirsty,
        capacity: 4,
        refillCost: 1,
      }),
    ).toThrow(/at most 12/)
  })

  it('nennt zu jedem Halt den Bogen, auf dem der Wagen ankommt', () => {
    const plan = planWatering({
      arrivals: oneWay,
      distance: line([0, 5, 2, 4]),
      depot: 0,
      hydrants: [1],
      thirsty: [2, 3],
      capacity: 4,
      refillCost: 1,
    })
    expect(plan.stops.map((stop) => stop.arc)).toEqual(plan.stops.map((stop) => stop.site))
  })

  it('gießt unter gleich langen Touren den durstigeren Baum zuerst', () => {
    // depot at 0, trees at -2 and +2: both orders drive 8
    const input = {
      arrivals: oneWay,
      distance: line([0, -2, 2]),
      depot: 0,
      hydrants: [],
      thirsty: [1, 2],
      capacity: 2,
      refillCost: 1,
    }
    const first = (urgent: number) =>
      planWatering({ ...input, urgency: (site) => (site === urgent ? 1 : 0.1) }).stops[0].site
    expect(first(1)).toBe(1)
    expect(first(2)).toBe(2)
  })

  it('nimmt für den durstigeren Baum nie einen längeren Weg in Kauf', () => {
    // Watering tree 1 first drives 7.2, tree 2 first 7.
    const table = [
      [0, 5, 1],
      [5, 0, 1],
      [1.2, 1, 0],
    ]
    const plan = planWatering({
      arrivals: oneWay,
      distance: (from, to) => table[from][to],
      depot: 0,
      hydrants: [],
      thirsty: [1, 2],
      capacity: 2,
      refillCost: 1,
      urgency: (site) => (site === 1 ? 1 : 0),
    })
    expect(plan.stops.map((stop) => stop.site)).toEqual([2, 1, 0])
    expect(plan.length).toBeCloseTo(7)
  })
})

describe('planWatering auf Straßen mit Fahrtrichtung', () => {
  // A block of streets; the depot sits at the end of a dead end below.
  const streets: Street[] = [
    { from: [0, 0], to: [20, 0] },
    { from: [0, 10], to: [20, 10] },
    { from: [0, 0], to: [0, 10] },
    { from: [10, 0], to: [10, 10] },
    { from: [20, 0], to: [20, 10] },
    { from: [10, 10], to: [10, 16] },
  ]
  const graph = roadGraph(streets, [
    [10, 16],
    [20, 5],
    [2, 0],
    [8, 0],
    [15, 10],
    [0, 5],
    [18, 0],
    [10, 4],
  ])
  const plan = planWatering({
    arrivals: graph.arrivals,
    distance: graph.distance,
    depot: 0,
    hydrants: [1],
    thirsty: [2, 3, 4, 5, 6, 7],
    capacity: 3,
    refillCost: 1,
  })

  it('gießt jeden Baum genau einmal', () => {
    const watered = plan.stops.filter((stop) => stop.kind === 'tree').map((stop) => stop.site)
    expect([...watered].sort()).toEqual([2, 3, 4, 5, 6, 7])
    expect(plan.stops.at(-1)?.arc).toBe(graph.arrivals(0)[0])
  })

  it('verlässt keinen Halt gegen die Richtung, in der der Wagen ankam', () => {
    plan.stops.slice(0, -1).forEach((stop, index) => {
      if (stop.site === 0) return
      const [from, to] = graph.arcEnds(stop.arc)
      const way = graph.path(stop.arc, plan.stops[index + 1].arc)
      const arrived = [to[0] - from[0], to[1] - from[1]]
      const leaving = [way[1][0] - way[0][0], way[1][1] - way[0][1]]
      const cos =
        (arrived[0] * leaving[0] + arrived[1] * leaving[1]) /
        (Math.hypot(arrived[0], arrived[1]) * Math.hypot(leaving[0], leaving[1]))
      expect(cos).toBeGreaterThan(0.99)
    })
  })

  it('misst die Tour als Summe der gefahrenen Wege', () => {
    let at = graph.arrivals(0)[0]
    let total = 0
    for (const stop of plan.stops) {
      total += graph.distance(at, stop.arc)
      at = stop.arc
    }
    expect(plan.length).toBeCloseTo(total)
  })
})
