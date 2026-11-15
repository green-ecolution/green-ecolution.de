import { describe, expect, it } from 'vitest'
import { planDay } from '../components/islands/product/dayModel'
import { DEPOT_SITE, HYDRANT_SITE, START_DAYS, TANK_CAPACITY } from '../data/productTown'
import type { GroundPoint } from './storyPath'
import {
  CRUISE,
  MAX_TOUR_SECONDS,
  FLY_OUT_SECONDS,
  GATEWAY_HOLD_SECONDS,
  PROBE_HOLD_SECONDS,
  RESULT_HOLD_SECONDS,
  RIDE_CRUISE,
  REFILL_HOLD_SECONDS,
  WATERING_HOLD_SECONDS,
  afterHold,
  holdAt,
  nextElapsed,
  relayAt,
  REFILL_SECONDS,
  RIDE_MIN_SECONDS,
  TO_DEPOT_SECONDS,
  TO_GATEWAY_SECONDS,
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

// Every hundredth of a second of the tour, its end included.
const samples = ({ duration }: TourScript) =>
  Array.from({ length: Math.ceil(duration / 0.01) + 1 }, (_, step) =>
    Math.min(duration, step * 0.01),
  )

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

  it('bleibt am Bauhof für die Bilanz stehen und endet mit ihrem Rückflug', () => {
    const { resultShot, dwells } = script
    expect(resultShot.flyIn.end).toBeCloseTo(dwells[2].start)
    expect(resultShot.shot.start).toBeCloseTo(dwells[2].start)
    expect(resultShot.flyOut.start).toBeCloseTo(resultShot.shot.end)
    expect(resultShot.flyOut.end).toBeCloseTo(dwells[2].end)
    expect(script.duration).toBeCloseTo(resultShot.flyOut.end)
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
    expect(seen).toEqual([
      'iso',
      'flyIn',
      'probing',
      'toGateway',
      'gateway',
      'flyOut',
      'iso',
      'flyIn',
      'watering',
      'flyOut',
      'iso',
      'flyIn',
      'result',
      'flyOut',
      'iso',
    ])
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

  it('dauert in der Ausgangsstellung 70 bis 85 Sekunden', () => {
    const { duration } = townScript(START_DAYS)
    expect(duration).toBeGreaterThanOrEqual(70)
    expect(duration).toBeLessThanOrEqual(90)
  })

  it('zeigt in der Ausgangsstellung Sonde, Fahrt und Gießen, Auffüllen und Bilanz, jede Einstellung in Folge', () => {
    const town = townScript(START_DAYS)
    const seen: ViewMode[] = []
    const shares: Partial<Record<ViewMode, number[]>> = {}
    for (const time of samples(town)) {
      const { mode, share } = tourFrame(town, time).view
      if (seen.at(-1) !== mode) seen.push(mode)
      ;(shares[mode] ??= []).push(share)
    }
    expect(seen).toEqual([
      'iso',
      'flyIn',
      'probing',
      'toGateway',
      'gateway',
      'flyOut',
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
      'flyIn',
      'result',
      'flyOut',
      'iso',
    ])
    for (const mode of [
      'probing',
      'toGateway',
      'gateway',
      'ride',
      'toWatering',
      'watering',
      'refilling',
      'result',
    ] as const) {
      const values = shares[mode] ?? []
      expect(values[0]).toBeLessThan(0.02)
      expect(values.at(-1)).toBeGreaterThan(0.98)
      values.forEach((value, index) => {
        if (index > 0) expect(value).toBeGreaterThan(values[index - 1])
      })
    }
    // Both flights run four times, each time from 0 to 1.
    for (const mode of ['flyIn', 'flyOut'] as const) {
      const values = shares[mode] ?? []
      const restarts = values.filter((value, index) => index > 0 && value < values[index - 1])
      expect(restarts).toHaveLength(3)
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

  it('zeichnet nach der Sonde die Route und fährt dann los', () => {
    const { plan, gatewayShot } = script
    if (!gatewayShot) throw new Error('the script has no gateway')
    expect(plan.start).toBeCloseTo(gatewayShot.toDepot.end)
    expect(plan.end).toBeCloseTo(script.lead)
    const early = tourFrame(script, (plan.start + plan.end) / 2)
    expect(early.shot).toBe('plan')
    expect(early.view.mode).toBe('iso')
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

  it('folgt dem Wagen bis zum Bauhof und zieht die Kamera erst dort in die Übersicht', () => {
    const home = script.legs[2]
    expect(tourFrame(script, home.start + 0.01).shot).toBe('follow')
    expect(tourFrame(script, home.end - 0.01).shot).toBe('follow')
    expect(tourFrame(script, home.end + 0.01).shot).toBe('home')
    expect(tourFrame(script, script.duration - 0.01).shot).toBe('home')
  })

  it('zählt die Tour erst nach dem Rückflug der Bilanz als erledigt', () => {
    const { resultShot } = script
    expect(tourFrame(script, resultShot.shot.start + 0.01).done).toBe(false)
    expect(tourFrame(script, resultShot.flyOut.end - 0.01).done).toBe(false)
    expect(tourFrame(script, resultShot.flyOut.end).done).toBe(true)
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
  const { showpiece, refillShot, probeShot, resultShot } = town
  if (!showpiece || !refillShot || !probeShot) throw new Error('the tour has no close-ups')
  const HOLDS = {
    probing: 'probe',
    gateway: 'gateway',
    watering: 'watering',
    refilling: 'refill',
    result: 'result',
  }

  it('hält die Karte genau so lange, wie die Sonde meldet, gegossen, aufgefüllt oder Bilanz gezogen wird', () => {
    const kinds = new Set<string>()
    for (let time = 0; time <= town.duration; time += 0.01) {
      const { mode, share } = tourFrame(town, time).view
      const hold = holdAt(town, time)
      if (mode in HOLDS) {
        expect(hold?.kind).toBe(HOLDS[mode as keyof typeof HOLDS])
        expect(hold?.left).toBeCloseTo(1 - share)
        kinds.add(hold?.kind ?? '')
      } else {
        expect(hold).toBeNull()
      }
    }
    expect([...kinds]).toEqual(['probe', 'gateway', 'watering', 'refill', 'result'])
  })

  it('lässt die Nahaufnahmen sieben, sieben, acht und acht Sekunden stehen', () => {
    expect(probeShot.shot.end - probeShot.shot.start).toBeCloseTo(PROBE_HOLD_SECONDS, 1)
    expect(showpiece.watering.end - showpiece.watering.start).toBeCloseTo(WATERING_HOLD_SECONDS, 1)
    expect(refillShot.shot.end - refillShot.shot.start).toBeCloseTo(REFILL_HOLD_SECONDS, 1)
    expect(resultShot.shot.end - resultShot.shot.start).toBeCloseTo(RESULT_HOLD_SECONDS, 1)
  })

  it('springt mit „Weiterfahren“ an den Anfang des Rückflugs', () => {
    const watering = (showpiece.watering.start + showpiece.watering.end) / 2
    expect(afterHold(town, watering)).toBeCloseTo(showpiece.flyOut.start)
    expect(tourFrame(town, afterHold(town, watering)).view.mode).toBe('flyOut')
    const refilling = refillShot.shot.start + 0.1
    expect(afterHold(town, refilling)).toBeCloseTo(refillShot.flyOut.start)
  })

  it('springt mit „Weiter“ an der Sonde in den Flug zum Gateway', () => {
    const probing = probeShot.shot.start + 1
    expect(afterHold(town, probing)).toBeCloseTo(probeShot.shot.end)
    expect(tourFrame(town, afterHold(town, probing)).view).toMatchObject({
      mode: 'toGateway',
      piece: 'gateway',
    })
    expect(tourFrame(town, town.plan.start + 0.01).reveal).toBeGreaterThan(0)
  })

  it('springt aus der Bilanz in ihren Rückflug, nach dem die Tour endet', () => {
    const result = resultShot.shot.start + 1
    expect(afterHold(town, result)).toBeCloseTo(resultShot.flyOut.start)
    expect(tourFrame(town, afterHold(town, result)).view).toMatchObject({
      mode: 'flyOut',
      piece: 'result',
    })
    expect(resultShot.flyOut.end).toBeCloseTo(town.duration)
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

describe('Sonde und Bilanz', () => {
  const town = townScript(START_DAYS)
  const { probeShot, resultShot, showpiece, dwells } = town
  if (!probeShot || !showpiece) throw new Error('the tour has no probe or showpiece')

  it('zeichnet die Route erst, wenn die Meldung im Bauhof angekommen ist', () => {
    for (let time = 0; time < town.plan.start; time += 0.01) {
      expect(tourFrame(town, time).reveal).toBe(0)
    }
    expect(tourFrame(town, town.plan.start + 0.05).reveal).toBeGreaterThan(0)
    expect(tourFrame(town, town.lead).reveal).toBe(1)
  })

  it('lässt den Wagen stehen, bis die Planung vorbei ist', () => {
    for (let time = 0; time < town.lead; time += 0.01) {
      const frame = tourFrame(town, time)
      expect(frame.leg).toBe(0)
      expect(frame.along).toBe(0)
      expect(frame.shot).toBe('plan')
    }
    expect(tourFrame(town, town.lead + 0.1).along).toBeGreaterThan(0)
  })

  it('beginnt die Bilanz, wenn der Wagen am Bauhof ankommt, und endet die Tour mit ihrem Rückflug', () => {
    const home = dwells[dwells.length - 1]
    expect(home.stop.kind).toBe('depot')
    expect(resultShot.flyIn.end).toBeCloseTo(home.start)
    expect(resultShot.shot.start).toBeCloseTo(home.start)
    expect(tourFrame(town, home.start - 0.01).dwell).toBe(-1)
    expect(tourFrame(town, home.start + 0.01).dwell).toBe(dwells.length - 1)
    expect(tourFrame(town, resultShot.flyOut.end - 0.01).done).toBe(false)
    expect(town.duration).toBeCloseTo(resultShot.flyOut.end)
    expect(holdAt(town, home.start + 0.01)?.kind).toBe('result')
  })

  it('gibt jeder Tour der Stadt Sonde und Bilanz, jede Einstellung in Folge', () => {
    for (let days = 5; days <= 14; days++) {
      const tour = townScript(days)
      const { probeShot: probe, resultShot: result } = tour
      expect(probe, `${days} days`).not.toBeNull()
      const seen: string[] = []
      for (const time of samples(tour)) {
        const { mode, piece } = tourFrame(tour, time).view
        const name = `${mode}:${piece}`
        if (seen.at(-1) !== name) seen.push(name)
      }
      expect(seen.slice(0, 7), `${days} days`).toEqual([
        'iso:null',
        'flyIn:probe',
        'probing:probe',
        'toGateway:gateway',
        'gateway:gateway',
        'flyOut:gateway',
        'iso:null',
      ])
      expect(seen.slice(-4), `${days} days`).toEqual([
        'flyIn:result',
        'result:result',
        'flyOut:result',
        'iso:null',
      ])
      expect(result.shot.start, `${days} days`).toBeCloseTo(
        tour.dwells[tour.dwells.length - 1].start,
      )
      // Every close-up comes out of the slanted view and goes back into it.
      const pieces = seen.filter((name) => name.startsWith('flyIn')).length
      expect(
        seen.filter((name) => name === 'iso:null'),
        `${days} days`,
      ).toHaveLength(pieces + 1)
    }
  })

  it('lässt die Bilanz erst nach dem Rückflug davor anfliegen, wenn der Heimweg kurz ist', () => {
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
    const { showpiece: shown, resultShot: result } = short
    if (!shown) throw new Error('the short tour has no showpiece')
    expect(result.flyIn.start).toBeGreaterThan(shown.flyOut.end)
    expect(result.shot.end - result.shot.start).toBeCloseTo(RESULT_HOLD_SECONDS)
    expect(short.duration).toBeCloseTo(result.flyOut.end)
  })
})

describe('Tempo und Bilanz', () => {
  it('lässt die Nahaufnahme beim Nachfüllen weichen, wenn sie in den Anflug der Bilanz fiele, auch bei gedrosseltem Tempo', () => {
    // A long tour, so it is paced; the hydrant lies just before the depot.
    const far: GroundPoint[] = [
      [0, 0],
      [1400, 0],
      [20, 0],
    ]
    const tour = tourScript(
      {
        stops: [
          { site: 1, arc: 1, kind: 'tree', arrivedWith: 1, leftWith: 0 },
          { site: 2, arc: 2, kind: 'refill', arrivedWith: 0, leftWith: 1 },
          { site: 0, arc: 0, kind: 'depot', arrivedWith: 1, leftWith: 1 },
        ],
        length: 2800,
      },
      (from, to) => [far[from], far[to]],
      AT_DEPOT,
      1,
    )
    expect(tour.duration).toBeCloseTo(MAX_TOUR_SECONDS)
    expect(tour.refillShot).toBeNull()
    const home = tour.dwells[tour.dwells.length - 1]
    expect(tour.resultShot.flyIn.end).toBeCloseTo(home.start)
  })

  it('bleibt unter der Höchstdauer, auch wenn die Bilanz auf einen kurzen Heimweg warten muss', () => {
    // A long detour to a tree right beside the depot, and a short way home.
    const sitesNear: GroundPoint[] = [
      [0, 0],
      [6, 0],
    ]
    const tour = tourScript(
      {
        stops: [
          { site: 1, arc: 1, kind: 'tree', arrivedWith: 1, leftWith: 0 },
          { site: 0, arc: 0, kind: 'depot', arrivedWith: 0, leftWith: 0 },
        ],
        length: 1418,
      },
      (from, to) =>
        from === 0
          ? [sitesNear[0], [0, 700], [6, 700], sitesNear[1]]
          : [sitesNear[from], sitesNear[to]],
      AT_DEPOT,
      1,
    )
    const { showpiece, resultShot } = tour
    if (!showpiece) throw new Error('the detour has no showpiece')
    expect(resultShot.flyIn.start).toBeGreaterThan(showpiece.flyOut.end)
    expect(tour.duration).toBeLessThanOrEqual(MAX_TOUR_SECONDS + 1e-9)
    expect(tour.duration).toBeCloseTo(MAX_TOUR_SECONDS)
  })
})

describe('Meldung zum Bauhof', () => {
  const town = townScript(START_DAYS)
  const { probeShot, gatewayShot } = town
  if (!probeShot || !gatewayShot) throw new Error('the tour has no probe or gateway')
  const { flyIn, shot, flyOut, toDepot } = gatewayShot

  it('fliegt mit der Kamera von der Sonde zum Gateway, sobald die Karte der Sonde geht', () => {
    expect(flyIn.start).toBeCloseTo(probeShot.shot.end)
    expect(flyIn.end - flyIn.start).toBeCloseTo(TO_GATEWAY_SECONDS, 1)
    expect(relayAt(town, flyIn.start - 0.01)).toBeNull()
    expect(relayAt(town, flyIn.start)).toEqual({ up: 0, over: 0 })
    const midway = (flyIn.start + flyIn.end) / 2
    expect(relayAt(town, midway)).toEqual({ up: 0.5, over: 0 })
    expect(tourFrame(town, midway).view).toMatchObject({ mode: 'toGateway', piece: 'gateway' })
  })

  it('hält am Gateway mit seiner Karte, die Meldung ruht dort', () => {
    expect(shot.start).toBeCloseTo(flyIn.end)
    expect(shot.end - shot.start).toBeCloseTo(GATEWAY_HOLD_SECONDS, 1)
    for (let time = shot.start; time < shot.end; time += 0.05) {
      expect(tourFrame(town, time).view.mode).toBe('gateway')
      expect(holdAt(town, time)?.kind).toBe('gateway')
      expect(relayAt(town, time)).toEqual({ up: 1, over: 0 })
    }
  })

  it('lässt die Meldung zum Bauhof weiterfliegen, während die Kamera in die Übersicht zurückkehrt', () => {
    expect(flyOut.start).toBeCloseTo(shot.end)
    expect(toDepot.start).toBeCloseTo(flyOut.start)
    expect(flyOut.end - flyOut.start).toBeCloseTo(FLY_OUT_SECONDS, 1)
    expect(toDepot.end - toDepot.start).toBeCloseTo(TO_DEPOT_SECONDS, 1)
    expect(toDepot.end).toBeGreaterThan(flyOut.end)
    expect(tourFrame(town, flyOut.start + 0.5).view).toMatchObject({
      mode: 'flyOut',
      piece: 'gateway',
    })
    expect(tourFrame(town, flyOut.end + 0.1).view.mode).toBe('iso')
    expect(relayAt(town, flyOut.end + 0.1)?.over).toBeGreaterThan(0.5)
  })

  it('zeichnet die Route, sobald die Meldung im Bauhof ist, dann fährt der Wagen los', () => {
    expect(toDepot.end).toBeCloseTo(town.plan.start)
    expect(relayAt(town, toDepot.end)).toBeNull()
    expect(tourFrame(town, toDepot.end - 0.05).reveal).toBe(0)
    expect(tourFrame(town, town.lead + 0.1).along).toBeGreaterThan(0)
  })

  it('springt mit „Weiter“ am Gateway in den Rückflug', () => {
    expect(afterHold(town, shot.start + 1)).toBeCloseTo(flyOut.start)
  })

  it('wartet, solange jemand die Karte am Gateway liest', () => {
    expect(nextElapsed(town, shot.start + 1, 0.5, true)).toBe(shot.start + 1)
  })

  it('entfällt mit der Sonde bei einer Tour ohne Baum', () => {
    const refillOnly: Plan = {
      stops: [{ site: 0, arc: 0, kind: 'depot', arrivedWith: 0, leftWith: 0 }],
      length: 0,
    }
    const script = tourScript(refillOnly, straight, AT_DEPOT, 2)
    expect(script.gatewayShot).toBeNull()
    expect(relayAt(script, 0.5)).toBeNull()
  })
})
