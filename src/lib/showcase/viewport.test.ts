import { describe, expect, it } from 'vitest'
import { fitsShowcase, SHOWCASE_MIN_HEIGHT, SHOWCASE_MIN_WIDTH } from './viewport'

describe('fitsShowcase', () => {
  // Der Messestand ist der Fall, der nicht scheitern darf: das gedrehte Touch
  // Display 2 liefert 1280x720, nicht die 1920x1080, fuer die die Szenen
  // gezeichnet sind.
  it('laesst die Tafel am Stand durch', () => {
    expect(fitsShowcase({ width: 1280, height: 720 })).toBe(true)
  })

  it('laesst den Bildschirm durch, fuer den die Tafel gebaut ist', () => {
    expect(fitsShowcase({ width: 1920, height: 1080 })).toBe(true)
  })

  it('laesst ein Notebook mit Browserleiste durch', () => {
    expect(fitsShowcase({ width: 1366, height: 640 })).toBe(true)
  })

  it('haelt ein Handy im Hochformat auf', () => {
    expect(fitsShowcase({ width: 390, height: 844 })).toBe(false)
  })

  // Quer gedreht ist ein Handy breit genug fuer die Spalten, aber zu flach:
  // die Tafel scrollt nicht, was nicht in die Hoehe passt, wird abgeschnitten.
  it('haelt ein Handy im Querformat auf', () => {
    expect(fitsShowcase({ width: 844, height: 390 })).toBe(false)
  })

  it('haelt ein Tablet im Hochformat auf', () => {
    expect(fitsShowcase({ width: 820, height: 1180 })).toBe(false)
  })

  it('laesst ein Tablet im Querformat durch', () => {
    expect(fitsShowcase({ width: 1180, height: 820 })).toBe(true)
  })

  it('laesst die Schwelle selbst durch', () => {
    expect(fitsShowcase({ width: SHOWCASE_MIN_WIDTH, height: SHOWCASE_MIN_HEIGHT })).toBe(true)
  })

  it('haelt einen Pixel unter der Schwelle auf', () => {
    expect(fitsShowcase({ width: SHOWCASE_MIN_WIDTH - 1, height: SHOWCASE_MIN_HEIGHT })).toBe(false)
    expect(fitsShowcase({ width: SHOWCASE_MIN_WIDTH, height: SHOWCASE_MIN_HEIGHT - 1 })).toBe(false)
  })
})
