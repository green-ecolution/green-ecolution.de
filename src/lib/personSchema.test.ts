import { describe, expect, it } from 'vitest'
import { personId, personSchema } from './personSchema'

const BASE = 'https://green-ecolution.de'

describe('personSchema', () => {
  it('vergibt eine stabile @id je Person', () => {
    expect(personSchema(BASE, { id: 'cedrik-hoffmann', name: 'Cedrik Hoffmann' })).toEqual({
      '@type': 'Person',
      '@id': personId(BASE, 'cedrik-hoffmann'),
      name: 'Cedrik Hoffmann',
    })
  })

  it('übernimmt Bild und Profile, wenn vorhanden', () => {
    const schema = personSchema(BASE, {
      id: 'cedrik-hoffmann',
      name: 'Cedrik Hoffmann',
      imageUrl: `${BASE}/_astro/portrait.jpg`,
      sameAs: ['https://example.org/profil'],
    })

    expect(schema.image).toBe(`${BASE}/_astro/portrait.jpg`)
    expect(schema.sameAs).toEqual(['https://example.org/profil'])
  })

  it('lässt leere Profillisten weg', () => {
    expect(personSchema(BASE, { id: 'a', name: 'A', sameAs: [] })).not.toHaveProperty('sameAs')
  })
})
