import { describe, expect, it } from 'vitest'
import { DEPOT_SITE, START_DAYS, depot, townTrees } from '../../../data/productTown'
import { ISO_VIEW, tourFrame } from '../../../lib/wateringDay'
import { NOT_WATERED, NO_ORDER, planDay } from './dayModel'
import type { DayLive } from './shared'
import { pinHeight } from '../scene3d/pinSize'
import {
  OVERVIEW,
  PARKED,
  TOWN_HEIGHT,
  TOWN_WIDTH,
  mapShot,
  showpieceWeight,
  slantedSpot,
  shotFor,
  truckPose,
  turned,
  wateredTree,
  type Stage,
} from './stage'

const day = planDay(START_DAYS)
if (!day) throw new Error('nothing planned')
const { script } = day

const idle: DayLive = {
  days: START_DAYS,
  watered: NOT_WATERED,
  order: NO_ORDER,
  selected: null,
  highlighted: null,
  script: null,
  elapsed: 0,
  running: false,
  isReading: false,
  onChange: null,
}

function stageAt(seconds: number): Stage {
  const frame = tourFrame(script, seconds)
  return {
    frame,
    truck: truckPose(script, frame),
    view: frame.view,
    iso: { at: [0, 0, 0], height: 1 },
    lens: null,
  }
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
  const parked: Stage = {
    frame: null,
    truck: PARKED,
    view: ISO_VIEW,
    iso: { at: [0, 0, 0], height: 1 },
    lens: null,
  }

  it('zeigt in Ruhe die ganze Stadt', () => {
    expect(shotFor(idle, parked)).toBe(OVERVIEW)
  })

  it('fährt zum ausgewählten Baum', () => {
    const shot = shotFor({ ...idle, selected: 3 }, parked)
    expect(shot.at[0]).toBe(townTrees[3].at[0])
    expect(shot.at[2]).toBe(townTrees[3].at[1])
    expect(shot.zoom).toBeGreaterThan(1)
  })

  it('bewegt die Kamera nicht, wenn ein Baum nur hervorgehoben ist', () => {
    expect(shotFor({ ...idle, highlighted: 3 }, parked)).toBe(OVERVIEW)
  })

  it('nimmt vor der Abfahrt das Bild für die Karte, sobald die Sonde die Kamera hat', () => {
    const touring = { ...idle, script }
    const map = { at: [3, 1, -2], zoom: 0.9 } as const
    expect(shotFor(touring, stageAt(0.1), map)).toBe(OVERVIEW)
    const { mapHold, plan } = script
    if (!mapHold) throw new Error('the tour has no map')
    expect(shotFor(touring, stageAt((mapHold.start + mapHold.end) / 2), map)).toBe(map)
    expect(shotFor(touring, stageAt((plan.start + plan.end) / 2), map)).toBe(map)
    expect(shotFor(touring, stageAt(script.duration), map)).toBe(OVERVIEW)
  })

  it('folgt während der Tour dem Wagen ohne Vorhalt und lässt die Auswahl liegen', () => {
    const touring = { ...idle, script, selected: 3 }
    expect(shotFor(touring, stageAt(0.1))).toBe(OVERVIEW)

    const driving = stageAt(script.legs[1].start + 0.2)
    const follow = shotFor(touring, driving)
    expect(follow.at[0]).toBeCloseTo(driving.truck.at[0])
    expect(follow.at[2]).toBeCloseTo(driving.truck.at[1])
    expect(follow.zoom).toBeGreaterThan(1)
  })

  it('hält an jedem Halt denselben Abstand wie auf der Fahrt', () => {
    const touring = { ...idle, script }
    const follow = shotFor(touring, stageAt(script.legs[1].start + 0.2)).zoom
    script.dwells.slice(0, -1).forEach((dwell) => {
      expect(shotFor(touring, stageAt((dwell.start + dwell.end) / 2)).zoom).toBe(follow)
    })
  })

  it('kehrt nach der Tour zur Übersicht zurück', () => {
    expect(shotFor({ ...idle, script }, stageAt(script.duration))).toBe(OVERVIEW)
  })
})

describe('slantedSpot', () => {
  const size = { width: 710, height: 570 }

  it('legt die Mitte der Stadt in die Mitte des Bildes', () => {
    expect(slantedSpot([0, 0, 0], OVERVIEW, size)).toEqual([355, 285])
  })

  it('zeigt Osten rechts unten, Süden links unten und oben oben', () => {
    const [eastX, eastY] = slantedSpot([10, 0, 0], OVERVIEW, size)
    expect(eastX).toBeGreaterThan(355)
    expect(eastY).toBeLessThan(285)
    const [southX, southY] = slantedSpot([0, 0, 10], OVERVIEW, size)
    expect(southX).toBeLessThan(355)
    expect(southY).toBeLessThan(285)
    const [upX, upY] = slantedSpot([0, 10, 0], OVERVIEW, size)
    expect(upX).toBeCloseTo(355)
    expect(upY).toBeGreaterThan(285)
  })

  it('füllt mit der Übersicht das Bild in der Breite oder in der Höhe', () => {
    const scale = (slantedSpot([1, 0, -1], OVERVIEW, size)[0] - 355) / Math.SQRT2
    expect(Math.min(size.width / TOWN_WIDTH, size.height / TOWN_HEIGHT)).toBeCloseTo(scale)
  })
})

describe('mapShot', () => {
  // The stage as tall as the panel, at 1440 px and on a tablet lying flat, with
  // the card in its bottom left corner at its shortest and its tallest, under
  // the bar with one line of text and with two.
  const stages = [
    { name: 'desktop', width: 710, height: 570 },
    { name: 'tablet', width: 559, height: 570 },
  ].flatMap((size) =>
    [208, 246].flatMap((cardHeight) =>
      [50, 68].map((barHeight) => ({
        ...size,
        name: `${size.name}, card ${cardHeight}, bar ${barHeight}`,
        card: { right: 332 / size.width, top: (cardHeight + 12) / size.height },
        bar: barHeight / size.height,
      })),
    ),
  )
  const GAP = 10

  it.each(stages)('hält bei $name jeden Baum samt Nadel neben oder über der Karte', (stage) => {
    const shot = mapShot(stage, stage.card, stage.bar)
    for (const tree of townTrees) {
      const [x, foot] = slantedSpot([tree.at[0], 0, tree.at[1]], shot, stage)
      const [, head] = slantedSpot([tree.at[0], pinHeight(tree), tree.at[1]], shot, stage)
      const isBeside = x >= stage.card.right * stage.width + GAP
      const isAbove = foot >= stage.card.top * stage.height + GAP
      expect(isBeside || isAbove, tree.id).toBe(true)
      expect(x, tree.id).toBeLessThan(stage.width - GAP)
      expect(head, tree.id).toBeLessThan(stage.height * (1 - stage.bar) - GAP)
    }
  })

  it.each(stages)('lässt bei $name die Stadt im Bild und unter der Leiste', (stage) => {
    const shot = mapShot(stage, stage.card, stage.bar)
    expect(shot.zoom).toBeLessThanOrEqual(1)
    expect(shot.zoom).toBeGreaterThanOrEqual(0.7)
    const scale = Math.min(stage.width / TOWN_WIDTH, stage.height / TOWN_HEIGHT) * shot.zoom
    // The middle of the town's box on screen: where the plate's centre stands.
    const [x, y] = slantedSpot([0, 0, 0], shot, stage)
    expect(x + (TOWN_WIDTH / 2) * scale).toBeLessThanOrEqual(stage.width + 1e-6)
    expect(x - (TOWN_WIDTH / 2) * scale).toBeGreaterThanOrEqual(-1e-6)
    // It only ever moves away from the card, and never up under the bar.
    expect(x).toBeGreaterThanOrEqual(stage.width / 2 - 1e-6)
    expect(y).toBeGreaterThanOrEqual(stage.height / 2 - 1e-6)
    if (y > stage.height / 2 + 1e-6) {
      expect(y + (TOWN_HEIGHT / 2) * scale).toBeLessThanOrEqual(
        stage.height * (1 - stage.bar) + 1e-6,
      )
    }
  })

  it('bleibt ohne Karte auf der Bühne bei der Übersicht', () => {
    expect(mapShot({ width: 358, height: 239 }, null, 0.2)).toBe(OVERVIEW)
  })

  it('bleibt bei der Übersicht, wenn die Karte ohnehin keinen Baum verdeckt', () => {
    const size = { width: 1400, height: 570 }
    expect(mapShot(size, { right: 0.05, top: 0.05 }, 0)).toBe(OVERVIEW)
  })
})

describe('showpieceWeight', () => {
  it('wächst über den Hinflug von 0 auf 1 und fällt über den Rückflug zurück', () => {
    expect(showpieceWeight(ISO_VIEW)).toBe(0)
    expect(showpieceWeight({ mode: 'flyIn', share: 0, piece: 'watering' })).toBe(0)
    expect(showpieceWeight({ mode: 'flyIn', share: 0.5, piece: 'watering' })).toBeCloseTo(0.5)
    expect(showpieceWeight({ mode: 'ride', share: 0.3, piece: 'watering' })).toBe(1)
    expect(showpieceWeight({ mode: 'watering', share: 0.9, piece: 'watering' })).toBe(1)
    expect(showpieceWeight({ mode: 'refilling', share: 0.1, piece: 'refill' })).toBe(1)
    expect(showpieceWeight({ mode: 'flyOut', share: 1, piece: 'watering' })).toBe(0)
    let before = 1
    for (let step = 0; step <= 10; step++) {
      const weight = showpieceWeight({ mode: 'flyOut', share: step / 10, piece: 'watering' })
      expect(weight).toBeLessThanOrEqual(before)
      before = weight
    }
  })
})
