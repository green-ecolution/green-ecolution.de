import { describe, expect, test } from 'vitest'
import { company } from '../data/company'
import { classifyLink } from './linkEvent'

const PAGE = 'https://green-ecolution.de/de/product'

describe('classifyLink', () => {
  test('sorts the contact channels', () => {
    expect(classifyLink(`mailto:${company.email}`, PAGE)).toEqual({
      name: 'contact_click',
      props: { channel: 'email' },
    })
    expect(classifyLink(company.phone.href, PAGE)?.props).toEqual({ channel: 'phone' })
  })

  test('names the booked appointment', () => {
    expect(classifyLink(company.booking.overviewUrl, PAGE)).toEqual({
      name: 'booking_click',
      props: { type: 'overview' },
    })
    expect(classifyLink(company.booking.introCallUrl, PAGE)?.props).toEqual({ type: 'intro_call' })
    expect(classifyLink(`${company.booking.liveDemoUrl}/`, PAGE)?.props).toEqual({
      type: 'live_demo',
    })
    expect(classifyLink('https://calendly.com/someone-else', PAGE)?.props).toEqual({
      type: 'other',
    })
  })

  test('recognises the demo instance', () => {
    expect(classifyLink('https://demo.green-ecolution.de', PAGE)).toEqual({
      name: 'demo_open',
      props: {},
    })
  })

  test('takes downloads by attribute or file extension', () => {
    expect(
      classifyLink('https://assets.example.org/press/pitch-deck/deck.pdf', PAGE)?.props,
    ).toEqual({ file: 'deck.pdf' })
    expect(classifyLink('/press/logos/green-ecolution-logos.zip', PAGE)).toEqual({
      name: 'download',
      props: { file: 'green-ecolution-logos.zip' },
    })
    expect(classifyLink('/press/images/tree', PAGE, true)?.name).toBe('download')
  })

  test('sorts social networks apart from other external links', () => {
    expect(classifyLink(company.instagramUrl, PAGE)).toEqual({
      name: 'social_click',
      props: { network: 'instagram' },
    })
    expect(classifyLink(company.githubUrl, PAGE)?.props).toEqual({ network: 'github' })
    expect(classifyLink(company.linkedinUrl, PAGE)?.props).toEqual({ network: 'linkedin' })
    expect(classifyLink('https://www.ndr.de/fernsehen/sendung', PAGE)).toEqual({
      name: 'outbound_click',
      props: { host: 'ndr.de' },
    })
  })

  test('ignores internal links and anchors', () => {
    expect(classifyLink('/de/contact', PAGE)).toBeNull()
    expect(classifyLink('#workflow', PAGE)).toBeNull()
    expect(classifyLink('https://www.green-ecolution.de/en', PAGE)).toBeNull()
    expect(classifyLink('javascript:void(0)', PAGE)).toBeNull()
  })
})
