import { describe, expect, it } from 'vitest'
import { planDay } from '../components/islands/product/dayModel'
import { DEPOT_SITE, HYDRANT_SITE, START_DAYS, TANK_CAPACITY } from '../data/productTown'
import type { GroundPoint } from './storyPath'
import {
  CRUISE,
  MAX_TOUR_SECONDS,
  RIDE_CRUISE,
  REFILL_HOLD_SECONDS,
  WATERING_HOLD_SECONDS,
  afterHold,
  holdAt,
  nextElapsed,
  REFILL_SECONDS,
  RIDE_MIN_SECONDS,
  WATER_SECONDS,
  tourFrame,
  tourScript,
  type TourScript,
  type ViewMode,
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

  it('legt das Schaustück an den ersten Baum der Tour', () => {
    const { showpiece, legs } = script
    if (!showpiece?.ride) throw new Error('the script has no ride')
    expect(showpiece.leg).toBe(0)
    expect(showpiece.flyIn.start).toBeGreaterThan(legs[0].start)
    expect(showpiece.ride.end - showpiece.ride.start).toBeGreaterThanOrEqual(RIDE_MIN_SECONDS)
  })

  it('gibt jeder Tour der Stadt ein Schaustück am ersten Baum', () => {
    for (let days = 5; days <= 14; days++) {
      const town = townScript(days)
      const first = town.dwells.findIndex(({ stop }) => stop.kind === 'tree')
      expect(town.showpiece?.leg, `${days} days`).toBe(first)
    }
  })

  it('fährt in die Fahrersicht, bis der Wagen am Baum ankommt', () => {
    const { showpiece, legs } = script
    if (!showpiece?.ride) throw new Error('the script has no ride')
    expect(showpiece.flyIn.end).toBeCloseTo(showpiece.ride.start)
    expect(showpiece.ride.end).toBeCloseTo(legs[showpiece.leg].end)
    expect(tourFrame(script, showpiece.ride.end - 1e-6).dwell).toBe(-1)
    expect(tourFrame(script, showpiece.ride.end + 1e-6).dwell).toBe(showpiece.leg)
  })

  it('zeigt das Gießen innerhalb des verlängerten Halts', () => {
    const { showpiece, dwells } = script
    if (!showpiece?.toWatering) throw new Error('the script has no swing to the watering')
    const stop = dwells[showpiece.leg]
    expect(stop.end - stop.start).toBeGreaterThan(WATER_SECONDS)
    expect(dwells[1].end - dwells[1].start).toBeCloseTo(WATER_SECONDS)
    expect(showpiece.toWatering.start).toBeCloseTo(stop.start)
    expect(showpiece.watering.start).toBeCloseTo(showpiece.toWatering.end)
    expect(showpiece.watering.end).toBeLessThanOrEqual(stop.end)
  })

  it('fliegt erst auf dem nächsten Abschnitt ganz zurück', () => {
    const { showpiece, dwells, legs } = script
    if (!showpiece) throw new Error('the script has no showpiece')
    expect(showpiece.flyOut.start).toBeCloseTo(showpiece.watering.end)
    expect(showpiece.flyOut.start).toBeLessThan(dwells[showpiece.leg].end)
    expect(showpiece.flyOut.end).toBeGreaterThan(legs[showpiece.leg + 1].start)
  })

  it('lässt die Fahrt weg, wenn der Weg zum ersten Baum zu kurz ist', () => {
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
    const { showpiece } = short
    if (!showpiece) throw new Error('the short tour has no showpiece')
    expect(showpiece.ride).toBeNull()
    expect(showpiece.toWatering).toBeNull()
    expect(showpiece.flyIn.end).toBeCloseTo(short.dwells[0].start)
    expect(showpiece.watering.start).toBeCloseTo(short.dwells[0].start)
    const seen: ViewMode[] = []
    for (let step = 0; step <= 1000; step++) {
      const { mode } = tourFrame(short, (short.duration * step) / 1000).view
      if (seen.at(-1) !== mode) seen.push(mode)
    }
    expect(seen).toEqual(['iso', 'flyIn', 'watering', 'flyOut', 'iso'])
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

  it('dauert in der Ausgangsstellung 55 bis 70 Sekunden', () => {
    const { duration } = townScript(START_DAYS)
    expect(duration).toBeGreaterThanOrEqual(55)
    expect(duration).toBeLessThanOrEqual(70)
  })

  it('zeigt in der Ausgangsstellung erst Fahrt und Gießen, dann das Auffüllen, jede Einstellung in Folge', () => {
    const town = townScript(START_DAYS)
    const seen: ViewMode[] = []
    const shares: Partial<Record<ViewMode, number[]>> = {}
    for (let time = 0; time <= town.duration; time += 0.01) {
      const { mode, share } = tourFrame(town, time).view
      if (seen.at(-1) !== mode) seen.push(mode)
      ;(shares[mode] ??= []).push(share)
    }
    expect(seen).toEqual([
      'iso',
      'flyIn',
      'ride',
      'toWatering',
      'watering',
      'flyOut',
      'iso',
      'flyIn',
      'refilling',
      'flyOut',
      'iso',
    ])
    for (const mode of ['ride', 'toWatering', 'watering', 'refilling'] as const) {
      const values = shares[mode] ?? []
      expect(values[0]).toBeLessThan(0.02)
      expect(values.at(-1)).toBeGreaterThan(0.98)
      values.forEach((value, index) => {
        if (index > 0) expect(value).toBeGreaterThan(values[index - 1])
      })
    }
    // Both flights run twice, each time from 0 to 1.
    for (const mode of ['flyIn', 'flyOut'] as const) {
      const values = shares[mode] ?? []
      const restarts = values.filter((value, index) => index > 0 && value < values[index - 1])
      expect(restarts).toHaveLength(1)
      expect(values[0]).toBeLessThan(0.02)
      expect(values.at(-1)).toBeGreaterThan(0.98)
    }
  })

  it('legt die Nahaufnahme ans erste Nachfüllen an der Wasserstelle', () => {
    const town = townScript(START_DAYS)
    const { refillShot, showpiece } = town
    if (!refillShot || !showpiece) throw new Error('the tour has no close-ups')
    const stop = town.dwells[refillShot.stop]
    expect(stop.stop.kind).toBe('refill')
    expect(stop.stop.site).toBe(HYDRANT_SITE)
    expect(town.dwells.findIndex((dwell) => dwell.stop.kind === 'refill')).toBe(refillShot.stop)
    const apart =
      refillShot.flyIn.start >= showpiece.flyOut.end ||
      showpiece.flyIn.start >= refillShot.flyOut.end
    expect(apart).toBe(true)
    expect(refillShot.flyIn.end).toBeCloseTo(stop.start)
    expect(refillShot.shot.start).toBeCloseTo(stop.start)
    expect(refillShot.shot.end).toBeLessThan(stop.end)
    expect(refillShot.flyOut.start).toBeCloseTo(refillShot.shot.end)
    expect(stop.end - stop.start).toBeGreaterThan(REFILL_SECONDS)
    const views = [0.25, 0.5, 0.75].map(
      (share) => tourFrame(town, stop.start + (stop.end - stop.start) * share).view,
    )
    expect(views.map((view) => view.piece)).toEqual(['refill', 'refill', 'refill'])
  })

  it('gibt einer Tour ohne Wasserstelle keine Nahaufnahme beim Nachfüllen', () => {
    expect(script.refillShot).toBeNull()
    const atDepot = tourScript(
      {
        stops: [
          { site: 1, arc: 1, kind: 'tree', arrivedWith: 1, leftWith: 0 },
          { site: 0, arc: 0, kind: 'refill', arrivedWith: 0, leftWith: 1 },
          { site: 2, arc: 2, kind: 'tree', arrivedWith: 1, leftWith: 0 },
          { site: 0, arc: 0, kind: 'depot', arrivedWith: 0, leftWith: 0 },
        ],
        length: 280,
      },
      straight,
      AT_DEPOT,
      1,
    )
    expect(atDepot.refillShot).toBeNull()
    expect(atDepot.dwells[1].end - atDepot.dwells[1].start).toBeCloseTo(REFILL_SECONDS)
  })

  it('verzichtet auf die Nahaufnahme beim Nachfüllen, wenn sie in den Rückflug fiele', () => {
    // The hydrant lies just past the tree at the end of the ride.
    const close: GroundPoint[] = [
      [0, 0],
      [60, 0],
      [66, 0],
    ]
    const crowded = tourScript(
      {
        stops: [
          { site: 1, arc: 1, kind: 'tree', arrivedWith: 1, leftWith: 0 },
          { site: 2, arc: 2, kind: 'refill', arrivedWith: 0, leftWith: 1 },
          { site: 0, arc: 0, kind: 'depot', arrivedWith: 1, leftWith: 1 },
        ],
        length: 132,
      },
      (from, to) => [close[from], close[to]],
      AT_DEPOT,
      1,
    )
    expect(crowded.showpiece).not.toBeNull()
    expect(crowded.refillShot).toBeNull()
    expect(crowded.dwells[1].end - crowded.dwells[1].start).toBeCloseTo(REFILL_SECONDS)
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
    expect(middle.shot).toBe('follow')
    expect(middle.dwell).toBe(0)
    expect(middle.served).toBe(0)
    expect(middle.tank).toBeCloseTo(1.5)

    const after = tourFrame(script, dwell.end + 0.01)
    expect(after.dwell).toBe(-1)
    expect(after.served).toBe(1)
    expect(after.tank).toBe(1)
    expect(after.leg).toBe(1)
  })

  it('nennt für jede Einstellung ihren Anteil', () => {
    const { showpiece } = script
    if (!showpiece) throw new Error('the script has no showpiece')
    expect(tourFrame(script, showpiece.flyIn.start - 0.01).view.mode).toBe('iso')
    const flying = tourFrame(script, (showpiece.flyIn.start + showpiece.flyIn.end) / 2)
    expect(flying.view.mode).toBe('flyIn')
    expect(flying.view.share).toBeCloseTo(0.5)
    expect(flying.shot).toBe('follow')
    expect(tourFrame(script, showpiece.flyOut.end + 0.01).view.mode).toBe('iso')
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
    const middle = tourFrame(town, (dwell.start + dwell.end) / 2)
    expect(middle.dwell).toBe(index)
    expect(middle.shot).toBe('follow')
    expect(tourFrame(town, dwell.end + 0.01).tank).toBe(TANK_CAPACITY)
  })
})

describe('Weg zum ersten Baum', () => {
  const STEP = 0.002
  // Road units per second between two samples of the leg.
  const speeds = (town: TourScript, from: number, to: number) => {
    const { showpiece } = town
    if (!showpiece) throw new Error('the tour has no showpiece')
    const leg = town.legs[showpiece.leg]
    const result: { time: number; speed: number; along: number }[] = []
    let before = tourFrame(town, from).along
    for (let time = from + STEP; time <= to + 1e-9; time += STEP) {
      const { along } = tourFrame(town, time)
      result.push({ time, speed: ((along - before) * leg.length) / STEP, along })
      before = along
    }
    return result
  }

  it('fährt an jedem Reglerstand ruhig durch die Fahrersicht', () => {
    for (let days = 5; days <= 14; days++) {
      const town = townScript(days)
      const ride = town.showpiece?.ride
      if (!ride) throw new Error(`no ride at ${days} days`)
      for (const { speed } of speeds(town, ride.start + STEP, ride.end - STEP)) {
        expect(speed, `${days} days`).toBeGreaterThan(RIDE_CRUISE * 0.85)
        expect(speed, `${days} days`).toBeLessThan(RIDE_CRUISE * 1.15)
      }
    }
  })

  it('fährt bis zum Anflug in normalem Tempo und bremst dann sanft ab', () => {
    // The longest way to the first tree, with room to cruise before the fly-in.
    const town = townScript(6)
    const { showpiece, legs } = town
    if (!showpiece?.ride) throw new Error('no ride at 6 days')
    const leg = legs[showpiece.leg]
    const before = speeds(town, leg.start, showpiece.flyIn.start)
    expect(Math.max(...before.map(({ speed }) => speed))).toBeCloseTo(CRUISE, 0)
    const all = speeds(town, leg.start, leg.end)
    all.forEach(({ speed }, index) => {
      // Smooth: no step in speed beyond what a second of easing gives.
      if (index > 0) expect(Math.abs(speed - all[index - 1].speed) / STEP).toBeLessThan(20)
    })
  })

  it('fährt den Weg stetig und ohne zurückzusetzen, an jedem Reglerstand', () => {
    for (let days = 5; days <= 14; days++) {
      const town = townScript(days)
      const { showpiece, legs } = town
      if (!showpiece) throw new Error(`no showpiece at ${days} days`)
      const leg = legs[showpiece.leg]
      expect(tourFrame(town, leg.start).along).toBeCloseTo(0, 6)
      const all = speeds(town, leg.start, leg.end - STEP / 2)
      for (const { speed } of all) {
        expect(speed, `${days} days`).toBeGreaterThanOrEqual(0)
        expect(speed, `${days} days`).toBeLessThan(CRUISE * 1.25)
      }
      expect(all.at(-1)?.along, `${days} days`).toBeCloseTo(1, 2)
    }
  })

  it('kommt am Ende der Fahrt am Baum an, an jedem Reglerstand', () => {
    for (let days = 5; days <= 14; days++) {
      const town = townScript(days)
      const { showpiece, legs } = town
      if (!showpiece?.ride) throw new Error(`no ride at ${days} days`)
      expect(showpiece.ride.end).toBeCloseTo(legs[showpiece.leg].end)
      expect(showpiece.ride.end - showpiece.ride.start).toBeGreaterThanOrEqual(RIDE_MIN_SECONDS)
      expect(tourFrame(town, showpiece.ride.end - 1e-6).along).toBeCloseTo(1, 4)
    }
  })
})

describe('Halt mit Karte', () => {
  const town = townScript(START_DAYS)
  const { showpiece, refillShot } = town
  if (!showpiece || !refillShot) throw new Error('the tour has no close-ups')

  it('hält die Karte genau so lange, wie gegossen oder aufgefüllt wird', () => {
    for (let time = 0; time <= town.duration; time += 0.01) {
      const { mode, share } = tourFrame(town, time).view
      const hold = holdAt(town, time)
      if (mode === 'watering' || mode === 'refilling') {
        expect(hold?.kind).toBe(mode === 'watering' ? 'watering' : 'refill')
        expect(hold?.left).toBeCloseTo(1 - share)
      } else {
        expect(hold).toBeNull()
      }
    }
  })

  it('lässt die Nahaufnahmen ungefähr acht und neun Sekunden stehen', () => {
    expect(showpiece.watering.end - showpiece.watering.start).toBeCloseTo(WATERING_HOLD_SECONDS, 0)
    expect(refillShot.shot.end - refillShot.shot.start).toBeCloseTo(REFILL_HOLD_SECONDS, 0)
  })

  it('springt mit „Weiterfahren“ an den Anfang des Rückflugs', () => {
    const watering = (showpiece.watering.start + showpiece.watering.end) / 2
    expect(afterHold(town, watering)).toBeCloseTo(showpiece.flyOut.start)
    expect(tourFrame(town, afterHold(town, watering)).view.mode).toBe('flyOut')
    const refilling = refillShot.shot.start + 0.1
    expect(afterHold(town, refilling)).toBeCloseTo(refillShot.flyOut.start)
  })

  it('lässt die Zeit außerhalb eines Halts, wie sie ist', () => {
    for (const time of [0, showpiece.flyIn.end + 1, showpiece.flyOut.start + 0.1, town.duration]) {
      expect(afterHold(town, time)).toBe(time)
    }
  })

  it('hält die Uhr an, solange jemand die Karte liest, und nur dann', () => {
    const during = showpiece.watering.start + 1
    expect(nextElapsed(town, during, 0.05, true)).toBe(during)
    expect(tourFrame(town, nextElapsed(town, during, 0.05, true))).toEqual(tourFrame(town, during))
    expect(nextElapsed(town, during, 0.05, false)).toBeCloseTo(during + 0.05)
    const riding = showpiece.flyIn.end + 1
    expect(nextElapsed(town, riding, 0.05, true)).toBeCloseTo(riding + 0.05)
    expect(nextElapsed(town, town.duration - 0.01, 0.05, false)).toBe(town.duration)
  })
})
