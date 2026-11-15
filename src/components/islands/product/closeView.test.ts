import { describe, expect, it } from 'vitest'
import { blocks, hydrant, plate, townTrees, treeOfSite } from '../../../data/productTown'
import type { Tree } from '../../../data/streamletTour'
import { blendPoses, projected } from '../../../lib/cameraPose'
import type { GroundPoint } from '../../../lib/storyPath'
import { planDay } from './dayModel'
import {
  framedView,
  isClearSpot,
  refillStop,
  refillView,
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

function refillAt(days: number) {
  const day = planDay(days)
  const stop = day && refillStop(day.script)
  return stop ? { stop, view: refillView(stop.truck, stop.heading) } : null
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

describe('framedView', () => {
  // The stage and its card at 1440 px, and a phone's stage without a card. The
  // refill card has two more lines of text.
  const desktop = { aspect: 695 / 464, card: { right: 332 / 695, top: 208 / 464 } }
  const refillCard = { right: 332 / 695, top: 246 / 464 }
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
      expectFramed(view, desktop.aspect, desktop.card, `desktop, ${days} days`)
      expectFramed(view, phone.aspect, phone.card, `phone, ${days} days`)
    }
  })

  it('hält beim Auffüllen Wagen, Schlauch und Hydrant ganz im Bild und neben der Karte', () => {
    for (let days = 5; days <= 14; days++) {
      const refill = refillAt(days)
      if (!refill) continue
      expectFramed(refill.view, desktop.aspect, refillCard, `desktop, ${days} days`)
      expectFramed(refill.view, phone.aspect, phone.card, `phone, ${days} days`)
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
