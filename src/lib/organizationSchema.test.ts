import { describe, expect, it } from 'vitest'
import { company } from '../data/company'
import { organizationSchema } from './organizationSchema'

describe('organizationSchema', () => {
  const schema = organizationSchema('https://green-ecolution.de', 'Beschreibung')

  it('nennt die Firma mit ihrem eingetragenen Namen', () => {
    expect(schema.name).toBe(company.name)
    expect(schema.alternateName).toBe('Green Ecolution')
  })

  it('führt die PROGEEK Group als Muttergesellschaft', () => {
    expect(schema.parentOrganization).toEqual({ '@type': 'Organization', name: 'PROGEEK Group' })
  })

  it('zerlegt die Anschrift für schema.org', () => {
    expect(schema.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: 'Marsweg 20',
      postalCode: '24943',
      addressLocality: 'Flensburg',
      addressCountry: 'DE',
    })
  })

  it('übernimmt Kontakt und Beschreibung', () => {
    expect(schema.email).toBe(company.email)
    expect(schema.telephone).toBe('+4946179330680')
    expect(schema.description).toBe('Beschreibung')
  })
})
