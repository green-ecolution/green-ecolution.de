import { describe, expect, it } from 'vitest'
import { DEPOT_SITE, START_DAYS, depot, townTrees } from '../../../data/productTown'
import { tourFrame } from '../../../lib/wateringDay'
import { NOT_WATERED, NO_ORDER, planDay } from './dayModel'
import type { DayLive } from './shared'
import { OVERVIEW, PARKED, shotFor, truckPose, turned, wateredTree, type Stage } from './stage'

const day = planDay(START_DAYS)
if (!day) throw new Error('nothing planned')
const { script } = day

const idle: DayLive = {
  days: START_DAYS,
  watered: NOT_WATERED,
  order: NO_ORDER,
  selected: null,
  script: null,
  elapsed: 0,
  running: false,
  onChange: null,
}

function stageAt(seconds: number): Stage {
  const frame = tourFrame(script, seconds)
  return { frame, truck: truckPose(script, frame), riding: false }
}

describe('turned', () => {
  it('dreht auf dem kürzeren Weg', () => {
    expect(turned(0, Math.PI / 2, 0.5)).toBeCloseTo(Math.PI / 4)
    expect(turned(3, -3, 1)).toBeCloseTo(3 + (2 * Math.PI - 6))
  })
})

describe('truckPose', () => {
  it('parkt ohne Tour vor dem Bauhof', () => {
    expect(truckPose(null, null)).toEqual(PARKED)
    expect(PARKED.at).toEqual(depot.stop)
  })

  it('steht beim Gießen am Halt des Baums', () => {
    const dwell = script.dwells[0]
    const pose = stageAt((dwell.start + dwell.end) / 2).truck
    const end = script.legs[0].path.at(-1)
    expect(pose.at[0]).toBeCloseTo(end?.[0] ?? NaN)
    expect(pose.at[1]).toBeCloseTo(end?.[1] ?? NaN)
  })

  it('zeigt am Ende eines Halts in die Richtung der Weiterfahrt', () => {
    script.dwells.slice(0, -1).forEach((dwell, index) => {
      const leaving = stageAt(dwell.end - 1e-6).truck.heading
      const next = stageAt(script.legs[index + 1].start + 1e-6).truck.heading
      expect(Math.cos(leaving - next)).toBeCloseTo(1, 3)
    })
  })

  it('verlässt an jedem Reglerstand jeden Halt in der Richtung, in der er ankam', () => {
    for (let days = 5; days <= 14; days++) {
      const planned = planDay(days)
      if (!planned) continue
      const tour = planned.script
      tour.dwells.slice(0, -1).forEach((dwell) => {
        // The depot is a yard at a dead end: there the truck may turn.
        if (dwell.stop.site === DEPOT_SITE) return
        const arrived = truckPose(tour, tourFrame(tour, dwell.start + 1e-6)).heading
        const leaving = truckPose(tour, tourFrame(tour, dwell.end - 1e-6)).heading
        expect(Math.cos(arrived - leaving), `${days} days`).toBeGreaterThan(0.99)
      })
    }
  })

  it('zählt die gefahrene Strecke über alle Abschnitte', () => {
    const total = script.legs.reduce((sum, leg) => sum + leg.length, 0)
    expect(stageAt(script.duration).truck.travelled).toBeCloseTo(total)
  })
})

describe('wateredTree', () => {
  it('nennt den Baum nur, während er gegossen wird', () => {
    const dwell = script.dwells[0]
    expect(wateredTree(script, stageAt(dwell.start - 0.1).frame)).toBeNull()
    expect(wateredTree(script, stageAt((dwell.start + dwell.end) / 2).frame)).not.toBeNull()
  })
})

describe('shotFor', () => {
  const parked: Stage = { frame: null, truck: PARKED, riding: false }

  it('zeigt in Ruhe die ganze Stadt', () => {
    expect(shotFor(idle, parked)).toBe(OVERVIEW)
  })

  it('fährt zum ausgewählten Baum', () => {
    const shot = shotFor({ ...idle, selected: 3 }, parked)
    expect(shot.at[0]).toBe(townTrees[3].at[0])
    expect(shot.at[2]).toBe(townTrees[3].at[1])
    expect(shot.zoom).toBeGreaterThan(1)
  })

  it('folgt während der Tour dem Wagen und lässt die Auswahl liegen', () => {
    const touring = { ...idle, script, selected: 3 }
    expect(shotFor(touring, stageAt(script.lead / 2))).toBe(OVERVIEW)

    const driving = stageAt(script.legs[1].start + 0.2)
    const follow = shotFor(touring, driving)
    expect(
      Math.hypot(follow.at[0] - driving.truck.at[0], follow.at[2] - driving.truck.at[1]),
    ).toBeLessThan(10)

    const dwell = script.dwells[0]
    const watering = shotFor(touring, stageAt((dwell.start + dwell.end) / 2))
    expect(watering.zoom).toBeGreaterThan(follow.zoom)
  })

  it('kehrt nach der Tour zur Übersicht zurück', () => {
    expect(shotFor({ ...idle, script }, stageAt(script.duration))).toBe(OVERVIEW)
  })
})
