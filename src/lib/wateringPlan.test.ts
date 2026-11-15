import { describe, expect, it } from 'vitest'
import { MAX_TREES, planWatering, type Plan, type PlanInput } from './wateringPlan'

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
        distance: () => 1,
        depot: 0,
        hydrants: [],
        thirsty,
        capacity: 4,
        refillCost: 1,
      }),
    ).toThrow(/at most 12/)
  })
})
