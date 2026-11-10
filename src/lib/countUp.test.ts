import { describe, expect, it } from 'vitest'
import { formatFigure, parseFigure } from './countUp'

describe('parseFigure', () => {
  it('trennt Präfix, Zahl und Suffix', () => {
    expect(parseFigure('bis 60.000 €')).toEqual({
      prefix: 'bis ',
      value: 60000,
      separator: '.',
      suffix: ' €',
    })
  })

  it('erkennt das englische Tausendertrennzeichen', () => {
    expect(parseFigure('1,700 €')).toMatchObject({ value: 1700, separator: ',' })
  })

  it('kommt mit Zahlen ohne Trennzeichen aus', () => {
    expect(parseFigure('3+')).toEqual({ prefix: '', value: 3, separator: '', suffix: '+' })
  })

  it('liefert null für Text ohne Zahl', () => {
    expect(parseFigure('Variable')).toBeNull()
  })
})

describe('formatFigure', () => {
  it.each(['50.000', '1.700 €', 'bis 60.000 €', '50,000', 'up to 60,000 €', '3+'])(
    'stellt %s beim Endwert unverändert wieder her',
    (text) => {
      const figure = parseFigure(text)!
      expect(formatFigure(figure, figure.value)).toBe(text)
    },
  )

  it('rundet Zwischenwerte und setzt die Trennzeichen neu', () => {
    const figure = parseFigure('bis 60.000 €')!
    expect(formatFigure(figure, 1234.6)).toBe('bis 1.235 €')
    expect(formatFigure(figure, 0)).toBe('bis 0 €')
  })
})
