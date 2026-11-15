import { describe, expect, it } from 'vitest'
import { planDay } from '../components/islands/product/dayModel'
import { DEPOT_SITE, START_DAYS, TANK_CAPACITY } from '../data/productTown'
import type { GroundPoint } from './storyPath'
import {
  CUT_SECONDS,
  MAX_TOUR_SECONDS,
  POV_MIN_SECONDS,
  POV_SECONDS,
  tourFrame,
  tourScript,
  type TourScript,
} from './wateringDay'
import type { Plan } from './wateringPlan'

// The town's tours as the page plans them.
function townScript(days: number): TourScript {
  const day = planDay(days)
  if (!day) throw new Error(`nothing to water at ${days} days`)
  return day.script
}

// depot at x = 0, a tree at 60 and one at 80, all on one road
const sites: GroundPoint[] = [
  [0, 0],
  [60, 0],
  [80, 0],
]
// One arrival per site, so a site is its own arc.
const straight = (from: number, to: number): GroundPoint[] => [sites[from], sites[to]]
const AT_DEPOT = { site: 0, arc: 0 }
const twoTrees: Plan = {
  stops: [
    { site: 1, arc: 1, kind: 'tree', arrivedWith: 2, leftWith: 1 },
    { site: 2, arc: 2, kind: 'tree', arrivedWith: 1, leftWith: 0 },
    { site: 0, arc: 0, kind: 'depot', arrivedWith: 0, leftWith: 0 },
  ],
  length: 160,
}

describe('tourScript', () => {
  const script = tourScript(twoTrees, straight, AT_DEPOT, 2)

  it('reiht Abschnitte und Halte lückenlos aneinander', () => {
    expect(script.legs).toHaveLength(3)
    expect(script.dwells).toHaveLength(3)
    expect(script.legs[0].start).toBeCloseTo(script.lead)
    script.legs.forEach((leg, index) => {
      expect(leg.end).toBeGreaterThan(leg.start)
      expect(script.dwells[index].start).toBeCloseTo(leg.end)
      if (index > 0) expect(leg.start).toBeCloseTo(script.dwells[index - 1].end)
    })
    expect(script.duration).toBeCloseTo(script.dwells[2].end)
  })

  it('hält am Depot nicht mehr an', () => {
    expect(script.dwells[2].end).toBeCloseTo(script.dwells[2].start)
  })

  it('legt die Fahrersicht auf den längsten Abschnitt, der an einem Baum endet', () => {
    const { pov, legs } = script
    expect(pov).not.toBeNull()
    if (!pov) return
    expect(pov.start).toBeGreaterThan(legs[0].start)
    expect(pov.end).toBeLessThan(legs[0].end)
    expect(pov.end - pov.start).toBeGreaterThanOrEqual(POV_MIN_SECONDS)
    expect(pov.end - pov.start).toBeLessThanOrEqual(POV_SECONDS + 1e-9)
  })

  it('verzichtet auf die Fahrersicht, wenn kein Abschnitt lang genug ist', () => {
    const near: GroundPoint[] = [
      [0, 0],
      [6, 0],
    ]
    const short = tourScript(
      {
        stops: [
          { site: 1, arc: 1, kind: 'tree', arrivedWith: 1, leftWith: 0 },
          { site: 0, arc: 0, kind: 'depot', arrivedWith: 0, leftWith: 0 },
        ],
        length: 12,
      },
      (from, to) => [near[from], near[to]],
      AT_DEPOT,
      1,
    )
    expect(short.pov).toBeNull()
  })

  it('lehnt einen Plan ohne Halte ab', () => {
    expect(() => tourScript({ stops: [], length: 0 }, straight, AT_DEPOT, 2)).toThrow(
      /at least one stop/,
    )
  })

  it('legt die Abschnitte so, dass das Band nirgends zurückfaltet, außer am Bauhof', () => {
    const heading = (from: GroundPoint, to: GroundPoint) => {
      const length = Math.hypot(to[0] - from[0], to[1] - from[1])
      return [(to[0] - from[0]) / length, (to[1] - from[1]) / length]
    }
    for (let days = 5; days <= 14; days++) {
      const town = townScript(days)
      town.legs.slice(1).forEach((leg, index) => {
        if (town.dwells[index].stop.site === DEPOT_SITE) return
        const before = town.legs[index].path
        const arrived = heading(before[before.length - 2], before[before.length - 1])
        const leaving = heading(leg.path[0], leg.path[1])
        expect(arrived[0] * leaving[0] + arrived[1] * leaving[1], `${days} days`).toBeGreaterThan(
          0.99,
        )
      })
    }
  })

  it('bleibt in der Stadt an jedem Reglerstand unter der Höchstdauer', () => {
    for (let days = 5; days <= 14; days++) {
      expect(townScript(days).duration).toBeLessThanOrEqual(MAX_TOUR_SECONDS + 1e-9)
    }
  })

  it('zeigt in der Ausgangsstellung die Fahrersicht', () => {
    expect(townScript(START_DAYS).pov).not.toBeNull()
  })
})

describe('tourFrame', () => {
  const script = tourScript(twoTrees, straight, AT_DEPOT, 2)

  it('zeichnet zuerst die Route und fährt dann los', () => {
    const early = tourFrame(script, script.lead / 2)
    expect(early.shot).toBe('plan')
    expect(early.reveal).toBeCloseTo(0.5)
    expect(early.along).toBe(0)
    expect(early.tank).toBe(2)
    expect(tourFrame(script, script.lead + 0.01).reveal).toBe(1)
  })

  it('fährt jeden Abschnitt von Anfang bis Ende, ohne zurückzusetzen', () => {
    const leg = script.legs[0]
    let before = -1
    for (let step = 0; step <= 20; step++) {
      const frame = tourFrame(script, leg.start + ((leg.end - leg.start) * step) / 20 - 1e-6)
      expect(frame.along).toBeGreaterThanOrEqual(before)
      before = frame.along
    }
    expect(before).toBeCloseTo(1, 3)
  })

  it('leert den Tank beim Gießen und zählt den Halt danach als erledigt', () => {
    const dwell = script.dwells[0]
    const middle = tourFrame(script, (dwell.start + dwell.end) / 2)
    expect(middle.shot).toBe('water')
    expect(middle.dwell).toBe(0)
    expect(middle.served).toBe(0)
    expect(middle.tank).toBeCloseTo(1.5)

    const after = tourFrame(script, dwell.end + 0.01)
    expect(after.dwell).toBe(-1)
    expect(after.served).toBe(1)
    expect(after.tank).toBe(1)
    expect(after.leg).toBe(1)
  })

  it('schneidet in die Fahrersicht und wieder heraus', () => {
    const { pov } = script
    if (!pov) throw new Error('the script has no ride')
    expect(tourFrame(script, pov.start - 0.01).shot).toBe('follow')
    expect(tourFrame(script, pov.start + 0.01).shot).toBe('pov')
    expect(tourFrame(script, pov.end + 0.01).shot).toBe('follow')
    expect(tourFrame(script, pov.start).cut).toBeCloseTo(1)
    expect(tourFrame(script, pov.start + CUT_SECONDS / 2).cut).toBeCloseTo(0.5)
    expect(tourFrame(script, pov.start + CUT_SECONDS * 2).cut).toBe(0)
  })

  it('zieht die Kamera auf dem Heimweg zurück in die Übersicht', () => {
    const home = script.legs[2]
    expect(tourFrame(script, home.start + 0.01).shot).toBe('follow')
    expect(tourFrame(script, home.end - 0.01).shot).toBe('home')
  })

  it('endet mit allen Halten erledigt', () => {
    const end = tourFrame(script, script.duration + 5)
    expect(end.done).toBe(true)
    expect(end.served).toBe(3)
    expect(end.along).toBe(1)
    expect(end.tank).toBe(0)
  })

  it('füllt den Tank am Hydranten wieder auf', () => {
    const town = townScript(START_DAYS)
    const index = town.dwells.findIndex((dwell) => dwell.stop.kind === 'refill')
    const dwell = town.dwells[index]
    expect(tourFrame(town, (dwell.start + dwell.end) / 2).shot).toBe('refill')
    expect(tourFrame(town, dwell.end + 0.01).tank).toBe(TANK_CAPACITY)
  })
})
