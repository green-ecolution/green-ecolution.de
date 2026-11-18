import { describe, expect, it } from 'vitest'
import {
  START_DAYS,
  blocks,
  depot,
  hydrant,
  plate,
  townTrees,
  treeOfSite,
} from '../../../data/productTown'
import type { Tree } from '../../../data/streamletTour'
import { depotWidth } from '../../../data/streamletTour'
import { blendPoses, projected, type Vec3 } from '../../../lib/cameraPose'
import type { GroundPoint } from '../../../lib/storyPath'
import { planDay } from './dayModel'
import {
  framedView,
  homeStop,
  isClearSpot,
  probeView,
  refillStop,
  refillView,
  resultView,
  showpieceStop,
  wateringView,
  type CardCover,
  type CloseView,
  type StopPose,
} from './closeView'

const treeAt = (at: GroundPoint): Tree => ({ ...townTrees[0], at })

/** How far the camera stands along the truck's forward direction. */
const aheadOf = (view: CloseView, { truck, heading }: StopPose) =>
  [view.from, view.to].map(
    ({ position }) =>
      (position[0] - truck[0]) * Math.sin(heading) + (position[2] - truck[1]) * Math.cos(heading),
  )

function wateringAt(days: number) {
  const day = planDay(days)
  const stop = day && showpieceStop(day.script)
  if (!stop) throw new Error(`no close-up of the first tree at ${days} days`)
  return { stop, view: wateringView(stop.truck, stop.heading, stop.tree) }
}

function probeAt(days: number) {
  const day = planDay(days)
  const stop = day && showpieceStop(day.script)
  if (!stop) throw new Error(`no probe at the first tree at ${days} days`)
  return { stop, view: probeView(stop.truck, stop.heading, stop.tree) }
}

function resultAt(days: number) {
  const day = planDay(days)
  if (!day) throw new Error(`nothing planned at ${days} days`)
  const stop = homeStop(day.script)
  return { stop, view: resultView(stop.truck, stop.heading) }
}

function refillAt(days: number) {
  const day = planDay(days)
  const stop = day && refillStop(day.script)
  return stop ? { stop, view: refillView(stop.truck, stop.heading) } : null
}

// Whether the segment from a to b passes through the box.
function crossesBox(a: Vec3, b: Vec3, box: { min: number[]; max: number[] }): boolean {
  let enter = 0
  let leave = 1
  for (let axis = 0; axis < 3; axis++) {
    const step = b[axis] - a[axis]
    if (Math.abs(step) < 1e-9) {
      if (a[axis] < box.min[axis] || a[axis] > box.max[axis]) return false
      continue
    }
    const near = (box.min[axis] - a[axis]) / step
    const far = (box.max[axis] - a[axis]) / step
    enter = Math.max(enter, Math.min(near, far))
    leave = Math.min(leave, Math.max(near, far))
    if (enter > leave) return false
  }
  return true
}

const ground = (pose: { position: readonly number[] }): GroundPoint => [
  pose.position[0],
  pose.position[2],
]

describe('isClearSpot', () => {
  const [house] = blocks
  const tree: GroundPoint = [house.x + house.width, house.z]

  it('lehnt einen Platz im Haus ab', () => {
    expect(isClearSpot([house.x, house.z], tree, tree)).toBe(false)
  })

  it('lehnt einen Platz neben der Platte ab', () => {
    expect(isClearSpot([0, 200], [0, 0], [0, 0])).toBe(false)
  })

  it('lehnt einen Platz ab, von dem ein Haus den Baum verdeckt', () => {
    const behind: GroundPoint = [house.x - house.width, house.z]
    expect(isClearSpot(behind, tree, tree)).toBe(false)
  })

  it('nimmt einen freien Platz auf der Straße', () => {
    expect(isClearSpot([4, 0], [10, 8], [4, 8])).toBe(true)
  })
})

describe('wateringView', () => {
  it('findet an jedem Reglerstand einen freien Platz fürs Gießen am ersten Baum', () => {
    for (let days = 5; days <= 14; days++) {
      const day = planDay(days)
      const showpiece = day?.script.showpiece
      if (!day || !showpiece) throw new Error(`no close-up of the first tree at ${days} days`)
      const stop = showpieceStop(day.script)
      if (!stop) throw new Error(`no stop at ${days} days`)
      const view = wateringView(stop.truck, stop.heading, stop.tree)
      expect(view.clear, `${days} days`).toBe(true)
      expect(isClearSpot(ground(view.from), stop.tree.at, stop.truck)).toBe(true)
      expect(isClearSpot(ground(view.to), stop.tree.at, stop.truck)).toBe(true)
      expect(stop.tree).toBe(townTrees[treeOfSite(day.script.dwells[showpiece.leg].stop.site)])
    }
  })

  it('schaut von vorn schräg auf Wagen und Baum und kommt dabei näher', () => {
    const view = wateringView([4, 0], 0, treeAt([10, 0]))
    expect(view.clear).toBe(true)
    expect(view.from.position[2]).toBeGreaterThan(view.to.position[2])
    expect(view.to.position[2]).toBeGreaterThan(0)
    expect(view.from.target[0]).toBeCloseTo(7, 0)
  })

  it('rückt näher an den Wagen, bevor sie hinter ihn ausweicht', () => {
    const truck: GroundPoint = [0, -plate.depth / 2 + 16]
    const view = wateringView(truck, Math.PI, treeAt([truck[0] + 6, truck[1]]))
    expect(view.clear).toBe(true)
    expect(view.from.position[2]).toBeLessThan(truck[1])
  })

  it('weicht hinter den Wagen aus, wenn vorn kein Platz bleibt', () => {
    const truck: GroundPoint = [0, -plate.depth / 2 + 4]
    const view = wateringView(truck, Math.PI, treeAt([truck[0] + 6, truck[1]]))
    expect(view.clear).toBe(true)
    expect(view.from.position[2]).toBeGreaterThan(truck[1])
  })

  it('zeigt den Wagen an jedem Reglerstand von vorn', () => {
    for (let days = 5; days <= 14; days++) {
      const { stop, view } = wateringAt(days)
      for (const ahead of aheadOf(view, stop)) expect(ahead, `${days} days`).toBeGreaterThan(0)
    }
  })
})

describe('refillView', () => {
  it('findet an jedem Reglerstand mit Nahaufnahme beim Nachfüllen einen freien Platz', () => {
    let shots = 0
    for (let days = 5; days <= 14; days++) {
      const day = planDay(days)
      const stop = day && refillStop(day.script)
      if (!stop) continue
      shots++
      const view = refillView(stop.truck, stop.heading)
      expect(view.clear, `${days} days`).toBe(true)
      expect(isClearSpot(ground(view.from), hydrant.at, stop.truck)).toBe(true)
      expect(isClearSpot(ground(view.to), hydrant.at, stop.truck)).toBe(true)
    }
    expect(shots).toBeGreaterThan(0)
  })

  it('zeigt den Wagen am Hydranten an jedem Reglerstand von vorn', () => {
    for (let days = 5; days <= 14; days++) {
      const refill = refillAt(days)
      if (!refill) continue
      for (const ahead of aheadOf(refill.view, refill.stop)) {
        expect(ahead, `${days} days`).toBeGreaterThan(0)
      }
    }
  })
})

describe('probeView', () => {
  it('findet an jedem Reglerstand einen freien Platz an der Straße vor der Sonde', () => {
    for (let days = 5; days <= 14; days++) {
      const { stop, view } = probeAt(days)
      expect(view.clear, `${days} days`).toBe(true)
      expect(isClearSpot(ground(view.from), stop.tree.at, stop.truck)).toBe(true)
      expect(isClearSpot(ground(view.to), stop.tree.at, stop.truck)).toBe(true)
    }
  })

  it('steht so weit weg, dass die Nadel über der Krone ganz bleibt, und kommt dabei näher', () => {
    for (let days = 5; days <= 14; days++) {
      const { stop, view } = probeAt(days)
      const toTree = (pose: { position: readonly number[] }) =>
        Math.hypot(pose.position[0] - stop.tree.at[0], pose.position[2] - stop.tree.at[1])
      expect(toTree(view.to), `${days} days`).toBeLessThan(toTree(view.from))
      // NEAR_LENS in actors shrinks pins nearer than 15 units.
      expect(toTree(view.to), `${days} days`).toBeGreaterThan(15)
    }
  })
})

describe('resultView', () => {
  it('stellt sich neben die Stichstraße, mit freiem Blick auf Wagen und Halle', () => {
    for (const days of [5, 9, 14]) {
      const { stop, view } = resultAt(days)
      expect(stop.truck[0], `${days} days`).toBeCloseTo(depot.stop[0])
      expect(stop.truck[1], `${days} days`).toBeCloseTo(depot.stop[1])
      expect(view.clear, `${days} days`).toBe(true)
    }
  })

  it('schaut von hinten schräg auf den Wagen und frei auf das Tor der Halle daneben', () => {
    const { stop, view } = resultAt(START_DAYS)
    for (const ahead of aheadOf(view, stop)) expect(ahead).toBeLessThan(0)
    // The gate on the hall's face towards the road, and the tanker as a box.
    const gateX = depot.at[0] + depotWidth / 2
    const gate = [-2, 0, 2].flatMap((dz) =>
      [0.5, 1.8, 3.4].map((y): Vec3 => [gateX + 0.05, y, depot.at[1] + dz]),
    )
    const tanker = {
      min: [stop.truck[0] - 1.7, 0, stop.truck[1] - 4.6],
      max: [stop.truck[0] + 1.7, 5.2, stop.truck[1] + 5.3],
    }
    for (const pose of [view.from, view.to]) {
      expect(pose.position[0]).toBeGreaterThan(gateX)
      for (const point of gate) {
        expect(crossesBox(pose.position, point, tanker), point.join()).toBe(false)
      }
    }
  })
})

describe('framedView', () => {
  // The stage as tall as the panel beside it, at 1440 px and on a tablet lying
  // flat, each with the card in its corner, and a phone's stage without a card.
  // The refill card has two more lines of text.
  const CARD_WIDTH = 332
  const wideStages = [
    { name: 'desktop', width: 710, height: 570 },
    { name: 'tablet', width: 559, height: 570 },
  ].map(({ name, width, height }) => {
    const card = (top: number): CardCover => ({ right: CARD_WIDTH / width, top: top / height })
    return { name, aspect: width / height, card: card(208), refill: card(246), result: card(189) }
  })
  const phone = { aspect: 358 / 239, card: null }

  function expectFramed(view: CloseView, aspect: number, card: CardCover | null, what: string) {
    const framed = framedView(view, aspect, card)
    for (let share = 0; share <= 1 + 1e-9; share += 0.05) {
      const pose = blendPoses(framed.from, framed.to, share)
      for (const subject of framed.subjects) {
        const spot = projected(pose, aspect, subject)
        if (!spot) throw new Error(`${what}: a subject behind the camera`)
        const [x, y] = spot
        expect(Math.abs(x), what).toBeLessThan(1)
        expect(Math.abs(y), what).toBeLessThan(1)
        if (card) {
          const isBehindCard = x < card.right * 2 - 1 && y < card.top * 2 - 1
          expect(isBehindCard, what).toBe(false)
        }
      }
    }
  }

  it('hält beim Gießen Wagen, Strahl und Baum ganz im Bild und neben der Karte', () => {
    for (let days = 5; days <= 14; days++) {
      const { view } = wateringAt(days)
      for (const stage of wideStages) {
        expectFramed(view, stage.aspect, stage.card, `${stage.name}, ${days} days`)
      }
      expectFramed(view, phone.aspect, phone.card, `phone, ${days} days`)
    }
  })

  it('hält beim Auffüllen Wagen, Schlauch und Hydrant ganz im Bild und neben der Karte', () => {
    for (let days = 5; days <= 14; days++) {
      const refill = refillAt(days)
      if (!refill) continue
      for (const stage of wideStages) {
        expectFramed(refill.view, stage.aspect, stage.refill, `${stage.name}, ${days} days`)
      }
      expectFramed(refill.view, phone.aspect, phone.card, `phone, ${days} days`)
    }
  })

  it('hält an der Sonde Sonde, Baumscheibe, Krone und Nadel ganz im Bild und neben der Karte', () => {
    for (let days = 5; days <= 14; days++) {
      const { view } = probeAt(days)
      for (const stage of wideStages) {
        expectFramed(view, stage.aspect, stage.card, `${stage.name}, ${days} days`)
        expectFramed(view, stage.aspect, stage.refill, `${stage.name}, taller card, ${days} days`)
      }
      expectFramed(view, phone.aspect, phone.card, `phone, ${days} days`)
    }
  })

  it('hält in der Bilanz Wagen und Halle ganz im Bild und neben der Karte', () => {
    for (let days = 5; days <= 14; days++) {
      const { view } = resultAt(days)
      for (const stage of wideStages) {
        expectFramed(view, stage.aspect, stage.result, `${stage.name}, ${days} days`)
        expectFramed(view, stage.aspect, stage.card, `${stage.name}, taller card, ${days} days`)
      }
      expectFramed(view, phone.aspect, phone.card, `phone, ${days} days`)
    }
  })

  it('stellt die Aufnahme auf dem Telefon mittig', () => {
    const { view } = wateringAt(9)
    const framed = framedView(view, phone.aspect, null)
    const xs = framed.subjects.map(
      (subject) => projected(framed.from, phone.aspect, subject)?.[0] ?? 0,
    )
    expect(Math.min(...xs) + Math.max(...xs)).toBeCloseTo(0, 1)
  })
})
