// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

const trackEvent = vi.fn()

function click(selector: string, init: MouseEventInit = {}, type = 'click') {
  document
    .querySelector(selector)!
    .dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, ...init }))
}

describe('link events', () => {
  beforeAll(async () => {
    await import('./analytics')
    // jsdom cannot navigate and would log every followed link.
    document.addEventListener('click', (event) => event.preventDefault())
  })

  beforeEach(() => {
    trackEvent.mockClear()
    window.a = { pageView: vi.fn(), trackEvent }
    document.body.innerHTML = `
      <section data-track-area="instagram">
        <a id="instagram" href="https://www.instagram.com/green.ecolution"><svg><path id="icon"/></svg></a>
      </section>
      <footer data-track-area="footer"><a id="mail" href="mailto:info@green-ecolution.de">Mail</a></footer>
      <a id="internal" href="/de/contact">Kontakt</a>
      <a id="external" href="https://www.ndr.de/x">NDR</a>`
  })

  test('sends the classified link with the area it sits in', () => {
    click('#icon')
    expect(trackEvent).toHaveBeenCalledExactlyOnceWith('social_click', {
      network: 'instagram',
      area: 'instagram',
    })

    click('#mail')
    expect(trackEvent).toHaveBeenLastCalledWith('contact_click', {
      channel: 'email',
      area: 'footer',
    })
  })

  test('falls back to content outside a tracked area', () => {
    click('#external')
    expect(trackEvent).toHaveBeenCalledExactlyOnceWith('outbound_click', {
      host: 'ndr.de',
      area: 'content',
    })
  })

  test('counts a middle click once, a right click not at all', () => {
    click('#external', { button: 1 }, 'auxclick')
    click('#external', { button: 2 }, 'auxclick')
    expect(trackEvent).toHaveBeenCalledOnce()
  })

  test('leaves internal links to the page views', () => {
    click('#internal')
    expect(trackEvent).not.toHaveBeenCalled()
  })

  test('survives a blocked a.js', () => {
    window.a = undefined
    expect(() => click('#mail')).not.toThrow()
  })
})
