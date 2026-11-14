import { describe, expect, it } from 'vitest'
import { activeIndex, reachableRange, scrollProgress } from './scrollProgress'

describe('scrollProgress', () => {
  const viewport = 1000
  const range = { start: 0.85, end: 0.5 }

  it('beginnt, sobald die Oberkante die Startlinie erreicht', () => {
    expect(scrollProgress(850, 200, viewport, range)).toBe(0)
  })

  it('ist fertig, sobald die Unterkante die Ziellinie erreicht', () => {
    expect(scrollProgress(300, 200, viewport, range)).toBe(1)
  })

  it('wächst dazwischen linear', () => {
    expect(scrollProgress(575, 200, viewport, range)).toBeCloseTo(0.5)
  })

  it('bleibt unterhalb des Fensters bei 0 und oberhalb bei 1', () => {
    expect(scrollProgress(2000, 200, viewport, range)).toBe(0)
    expect(scrollProgress(-500, 200, viewport, range)).toBe(1)
  })

  it('kommt ohne Strecke zwischen Start und Ziel aus', () => {
    expect(scrollProgress(100, 0, viewport, { start: 0.5, end: 0.5 })).toBe(1)
  })
})

describe('activeIndex', () => {
  it('nimmt den letzten Abschnitt, der die Leselinie schon erreicht hat', () => {
    expect(activeIndex([100, 300, 600], 350)).toBe(1)
  })

  it('bleibt beim ersten Abschnitt, solange noch keiner die Linie erreicht hat', () => {
    expect(activeIndex([400, 600, 900], 350)).toBe(0)
  })

  it('endet beim letzten Abschnitt', () => {
    expect(activeIndex([-600, -300, -100], 350)).toBe(2)
  })
})

describe('reachableRange', () => {
  const range = { start: 0.6, end: 0.35 }

  it('lässt den Bereich, wenn die Seite weit genug scrollt', () => {
    expect(reachableRange(range, 0.1)).toEqual(range)
  })

  it('zieht die Ziellinie dorthin, wo die Unterkante am Seitenende steht', () => {
    expect(reachableRange(range, 0.5)).toEqual({ start: 0.6, end: 0.5 })
  })
})
