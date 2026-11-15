import { describe, expect, it } from 'vitest'
import { START_DAYS, townTrees } from '../../../data/productTown'
import { pinColors } from '../../../data/storyTown'
import de from '../../../i18n/locales/de/product.json'
import en from '../../../i18n/locales/en/product.json'
import {
  NOT_STARTED,
  NOT_WATERED,
  NO_ORDER,
  STATUS_KEYS,
  dayStatus,
  finished,
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
})

describe('STATUS_KEYS', () => {
  const lookUp = (catalog: unknown, key: string) =>
    key
      .split('.')
      .reduce<unknown>(
        (node, part) =>
          node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined,
        catalog,
      )

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
    expect(tankShare(day, finished(day.script))).toBeCloseTo(0.25)
  })
})
