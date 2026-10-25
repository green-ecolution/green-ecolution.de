import { describe, expect, it } from 'vitest'
import de from './locales/de'
import en from './locales/en'

// legal names PROGEEK GmbH as the analytics processor; the award photo shows
// people who were there for PROGEEK. Both are facts, not offers.
const PROGEEK_ALLOWED = new Set(['legal', 'home.award.imageAlt'])

function flatten(value: unknown, prefix: string): [string, string][] {
  if (typeof value === 'string') return [[prefix, value]]
  if (value === null || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, nested]) => flatten(nested, `${prefix}.${key}`))
}

const entries = [de, en].flatMap((catalog) =>
  Object.entries(catalog).flatMap(([namespace, value]) => flatten(value, namespace)),
)

describe('Katalogtexte', () => {
  it('nennen keine festen Messtiefen mehr', () => {
    const fixedDepths = entries.filter(([, text]) =>
      /30\s*[,/]\s*60|drei Tiefen|three depths/i.test(text),
    )
    expect(fixedDepths).toEqual([])
  })

  it('nennen PROGEEK nur als PROGEEK Group', () => {
    const offenders = entries.filter(
      ([key, text]) =>
        /PROGEEK(?! Group)/.test(text) &&
        !PROGEEK_ALLOWED.has(key) &&
        !PROGEEK_ALLOWED.has(key.split('.')[0]),
    )
    expect(offenders).toEqual([])
  })
})
