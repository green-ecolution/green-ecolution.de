import { describe, expect, it } from 'vitest'
import { HYDRANT_SITE, START_DAYS, townTrees } from '../../../data/productTown'
import { pinColors } from '../../../data/storyTown'
import de from '../../../i18n/locales/de/product.json'
import en from '../../../i18n/locales/en/product.json'
import {
  NOT_STARTED,
  NOT_WATERED,
  NO_ORDER,
  CARD_KEYS,
  STATUS_KEYS,
  dayStatus,
  finished,
  holdCopy,
  planDay,
  tankShare,
  thirstColors,
  treeRows,
  wateredAfter,
} from './dayModel'

describe('thirstColors', () => {
  it('nimmt die Farben der Nadeln in der Szene', () => {
    expect(thirstColors).toEqual({ dry: pinColors.alert, soon: pinColors.warn, ok: pinColors.ok })
  })
})

describe('treeRows', () => {
  it('stellt die trockensten Bäume nach oben', () => {
    const rows = treeRows(START_DAYS, NOT_WATERED, NO_ORDER)
    expect(rows).toHaveLength(12)
    expect(rows[0].id).toBe('markt')
    expect(rows.filter((row) => row.state === 'dry')).toHaveLength(6)
    rows.slice(1).forEach((row, index) => {
      expect(row.level).toBeGreaterThanOrEqual(rows[index].level)
    })
  })

  it('führt einen gegossenen Baum als versorgt am Ende', () => {
    const watered = townTrees.map((tree) => tree.id === 'markt')
    const rows = treeRows(START_DAYS, watered, NO_ORDER)
    const markt = rows.find((row) => row.id === 'markt')
    expect(markt).toMatchObject({ state: 'ok', watered: true, level: 1 })
    expect(rows[0].id).not.toBe('markt')
  })
})

describe('planDay', () => {
  it('plant nichts, wenn kein Baum Wasser braucht', () => {
    expect(planDay(0)).toBeNull()
  })

  it('nummeriert die Bäume in der Reihenfolge der Tour', () => {
    const day = planDay(START_DAYS)
    if (!day) throw new Error('nothing planned')
    expect(day.treeStops).toBe(6)
    expect(day.refills).toBe(1)
    expect(day.order.filter((number) => number > 0).sort()).toEqual([1, 2, 3, 4, 5, 6])
  })
})

describe('planDay in der Ausgangsstellung', () => {
  const day = planDay(START_DAYS)

  it('füllt genau einmal nach, unterwegs an der Wasserstelle und mit Resttank', () => {
    const refills = day?.script.dwells.filter(({ stop }) => stop.kind === 'refill') ?? []
    expect(refills).toHaveLength(1)
    expect(refills[0].stop.site).toBe(HYDRANT_SITE)
    expect(refills[0].stop.arrivedWith).toBeGreaterThan(0)
  })
})

describe('wateredAfter', () => {
  it('zählt nur die Bäume der erledigten Halte', () => {
    const day = planDay(START_DAYS)
    if (!day) throw new Error('nothing planned')
    expect(wateredAfter(day.script, 0).some(Boolean)).toBe(false)
    const afterTwo = wateredAfter(day.script, 2)
    expect(afterTwo.filter(Boolean)).toHaveLength(2)
    expect(afterTwo.every((done, index) => !done || [1, 2].includes(day.order[index]))).toBe(true)
  })
})

describe('dayStatus', () => {
  const day = planDay(START_DAYS)
  if (!day) throw new Error('nothing planned')
  const rows = treeRows(START_DAYS, NOT_WATERED, NO_ORDER)

  it('nennt vor der Tour, wie viele Bäume Wasser brauchen', () => {
    expect(dayStatus('idle', rows, null, NOT_STARTED)).toEqual({
      key: 'day.status.thirstyMany',
      vars: { count: 6 },
    })
    expect(dayStatus('idle', treeRows(0, NOT_WATERED, NO_ORDER), null, NOT_STARTED)).toEqual({
      key: 'day.status.none',
    })
    expect(dayStatus('idle', treeRows(5, NOT_WATERED, NO_ORDER), null, NOT_STARTED)).toEqual({
      key: 'day.status.thirstyOne',
    })
  })

  it('kündigt die geplante Tour samt Nachfüllen an', () => {
    expect(dayStatus('touring', rows, day, NOT_STARTED)).toEqual({
      key: 'day.status.plannedRefill',
      vars: { count: 6 },
    })
  })

  it('sagt an jedem Halt, was dort geschieht', () => {
    const refill = day.script.dwells.findIndex((dwell) => dwell.stop.kind === 'refill')
    expect(dayStatus('touring', rows, day, { served: 0, dwell: 0, done: false }).key).toBe(
      'day.status.watering',
    )
    expect(dayStatus('touring', rows, day, { served: refill, dwell: refill, done: false })).toEqual(
      { key: 'day.status.topUp' },
    )
  })

  it('nennt unterwegs das nächste Ziel', () => {
    const refill = day.script.dwells.findIndex((dwell) => dwell.stop.kind === 'refill')
    expect(dayStatus('touring', rows, day, { served: 1, dwell: -1, done: false }).key).toBe(
      'day.status.next',
    )
    expect(dayStatus('touring', rows, day, { served: refill, dwell: -1, done: false })).toEqual({
      key: 'day.status.toWater',
    })
    const last = day.script.dwells.length - 1
    expect(dayStatus('touring', rows, day, { served: last, dwell: -1, done: false })).toEqual({
      key: 'day.status.home',
    })
  })

  it('zieht am Ende Bilanz', () => {
    expect(dayStatus('done', rows, day, finished(day.script))).toEqual({
      key: 'day.status.done',
      vars: { watered: 6, rest: 6 },
    })
  })

  it('zieht schon Bilanz, sobald der Wagen am Bauhof steht', () => {
    const last = day.script.dwells.length - 1
    expect(dayStatus('touring', rows, day, { served: last, dwell: last, done: false })).toEqual({
      key: 'day.status.done',
      vars: { watered: 6, rest: 6 },
    })
    const one = planDay(5)
    if (!one) throw new Error('nothing planned at five days')
    const home = one.script.dwells.length - 1
    expect(dayStatus('touring', rows, one, { served: home, dwell: home, done: false })).toEqual({
      key: 'day.status.doneOne',
      vars: { rest: 11 },
    })
  })

  it('zeigt am Bauhof jeden Baum gegossen und den Tank, wie er am Ende ist', () => {
    const last = day.script.dwells.length - 1
    const arrived = { served: last, dwell: last, done: false }
    expect(wateredAfter(day.script, arrived.served)).toEqual(wateredAfter(day.script, Infinity))
    expect(wateredAfter(day.script, arrived.served).filter(Boolean)).toHaveLength(6)
    expect(tankShare(day, arrived)).toBe(tankShare(day, finished(day.script)))
  })
})

describe('holdCopy', () => {
  const day = planDay(START_DAYS)
  if (!day) throw new Error('nothing planned')

  it('nimmt für Gießen und Auffüllen die bekannten Texte mit „Weiterfahren“', () => {
    expect(holdCopy('watering', day)).toEqual({
      label: 'day.info.watering.label',
      title: 'day.info.watering.title',
      text: { key: 'day.info.watering.text' },
      next: 'day.info.next',
      announcesText: true,
    })
    expect(holdCopy('refill', day).next).toBe('day.info.next')
  })

  it('geht an der Sonde mit „Weiter“ weiter, weil der Wagen noch steht', () => {
    expect(holdCopy('probe', day)).toEqual({
      label: 'day.info.probe.label',
      title: 'day.info.probe.title',
      text: { key: 'day.info.probe.text' },
      next: 'day.info.probe.next',
      announcesText: true,
    })
  })

  it('zählt in der Bilanz die gegossenen und die übrigen Bäume und bietet „Noch einmal“', () => {
    expect(holdCopy('result', day)).toEqual({
      label: 'day.info.done.label',
      title: 'day.info.done.title',
      text: { key: 'day.info.done.text', vars: { watered: 6, rest: 6 } },
      next: 'day.tour.again',
      // The status line reads the counts out at the same moment.
      announcesText: false,
    })
    const one = planDay(5)
    if (!one) throw new Error('nothing planned at five days')
    expect(holdCopy('result', one).text).toEqual({
      key: 'day.info.done.textOne',
      vars: { rest: 11 },
    })
  })

  it('zählt die Bilanz nie ohne den Tag, den sie zählt', () => {
    expect(() => holdCopy('result', null)).toThrow(/needs the day/)
    expect(holdCopy('probe', null).text).toEqual({ key: 'day.info.probe.text' })
  })

  it.each(['probe', 'gateway', 'watering', 'refill', 'result'] as const)(
    'gibt der Insel die Texte für %s mit',
    (kind) => {
      const { label, title, text, next } = holdCopy(kind, day)
      const one = planDay(5)
      const textOne = one ? holdCopy(kind, one).text.key : text.key
      for (const key of [label, title, text.key, textOne, next]) {
        expect(CARD_KEYS, key).toContain(key)
      }
    },
  )

  it.each(CARD_KEYS)('%s steht in beiden Katalogen', (key) => {
    expect(typeof lookUp(de, key)).toBe('string')
    expect(typeof lookUp(en, key)).toBe('string')
  })
})

const lookUp = (catalog: unknown, key: string) =>
  key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined,
      catalog,
    )

describe('STATUS_KEYS', () => {
  it.each(STATUS_KEYS)('%s steht in beiden Katalogen', (key) => {
    expect(typeof lookUp(de, key)).toBe('string')
    expect(typeof lookUp(en, key)).toBe('string')
  })
})

describe('tankShare', () => {
  it('folgt dem Tank von voll bis zum Stand nach dem letzten Halt', () => {
    const day = planDay(START_DAYS)
    if (!day) throw new Error('nothing planned')
    expect(tankShare(null, NOT_STARTED)).toBe(1)
    expect(tankShare(day, NOT_STARTED)).toBe(1)
    expect(tankShare(day, { served: 1, dwell: -1, done: false })).toBeCloseTo(0.75)
    expect(tankShare(day, finished(day.script))).toBe(0)
  })
})
