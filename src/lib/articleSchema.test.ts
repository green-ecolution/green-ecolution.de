import { describe, expect, it } from 'vitest'
import { articleSchema } from './articleSchema'
import { organizationId } from './organizationSchema'

const BASE = 'https://green-ecolution.de'

describe('articleSchema', () => {
  const author = { '@type': 'Person', name: 'Cedrik Hoffmann' }
  const schema = articleSchema(BASE, {
    url: `${BASE}/de/blog/beitrag`,
    headline: 'Titel',
    description: 'Zusammenfassung',
    datePublished: '2026-10-25',
    imageUrl: `${BASE}/_astro/cover.jpg`,
    author,
  })

  it('beschreibt den Beitrag als BlogPosting', () => {
    expect(schema['@type']).toBe('BlogPosting')
    expect(schema.mainEntityOfPage).toBe(`${BASE}/de/blog/beitrag`)
    expect(schema.headline).toBe('Titel')
    expect(schema.datePublished).toBe('2026-10-25')
    expect(schema.image).toEqual([`${BASE}/_astro/cover.jpg`])
  })

  it('verweist auf Autor und Firma', () => {
    expect(schema.author).toBe(author)
    expect(schema.publisher).toEqual({ '@id': organizationId(BASE) })
  })
})
