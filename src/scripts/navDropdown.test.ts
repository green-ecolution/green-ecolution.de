// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { CLOSE_DELAY_MS, setup } from './navDropdown'

function mountNavigation() {
  const group = (id: string) =>
    [
      `<li data-nav-group id="group-${id}">`,
      `<button type="button" data-nav-trigger aria-expanded="false" id="trigger-${id}">${id}</button>`,
      `<div><a href="/${id}" id="link-${id}">${id}</a></div>`,
      '</li>',
    ].join('')

  document.body.innerHTML = `<ul>${group('product')}${group('company')}</ul><main id="outside"><a href="/x" id="elsewhere">x</a></main>`
}

const group = (id: string) => document.getElementById(`group-${id}`)!
const trigger = (id: string) => document.getElementById(`trigger-${id}`)!
const link = (id: string) => document.getElementById(`link-${id}`)!
const isOpen = (id: string) => group(id).hasAttribute('data-open')

function hover(type: 'pointerover' | 'pointerout', target: Element, relatedTarget?: Element) {
  target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, pointerType: 'mouse', relatedTarget }),
  )
}

describe('navDropdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mountNavigation()
    setup()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('a click opens the group and a second click closes it', () => {
    trigger('product').click()
    expect(isOpen('product')).toBe(true)
    expect(trigger('product').getAttribute('aria-expanded')).toBe('true')

    trigger('product').click()
    expect(isOpen('product')).toBe(false)
    expect(trigger('product').getAttribute('aria-expanded')).toBe('false')
  })

  test('opening one group closes the other', () => {
    trigger('product').click()
    trigger('company').click()

    expect(isOpen('product')).toBe(false)
    expect(isOpen('company')).toBe(true)
  })

  test('escape closes the group and hands focus back to its trigger', () => {
    trigger('product').click()
    link('product').focus()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(isOpen('product')).toBe(false)
    expect(document.activeElement).toBe(trigger('product'))
  })

  test('a click outside or on a panel link closes the group', () => {
    trigger('product').click()
    document.getElementById('outside')!.click()
    expect(isOpen('product')).toBe(false)

    trigger('product').click()
    link('product').addEventListener('click', (event) => event.preventDefault())
    link('product').click()
    expect(isOpen('product')).toBe(false)
  })

  test('stays open while focus moves inside and closes once it leaves', () => {
    trigger('product').focus()
    trigger('product').click()

    link('product').focus()
    expect(isOpen('product')).toBe(true)

    document.getElementById('elsewhere')!.focus()
    expect(isOpen('product')).toBe(false)
  })

  test('a mouse opens on hover and closes shortly after leaving', () => {
    hover('pointerover', trigger('product'))
    expect(isOpen('product')).toBe(true)

    hover('pointerout', trigger('product'), document.getElementById('outside')!)
    expect(isOpen('product')).toBe(true)

    vi.advanceTimersByTime(CLOSE_DELAY_MS)
    expect(isOpen('product')).toBe(false)
  })

  test('coming back before the delay runs out keeps the group open', () => {
    hover('pointerover', trigger('product'))
    hover('pointerout', trigger('product'), document.getElementById('outside')!)
    hover('pointerover', link('product'))

    vi.advanceTimersByTime(CLOSE_DELAY_MS)
    expect(isOpen('product')).toBe(true)
  })

  test('a mouse click on a hovered trigger does not shut the panel again', () => {
    hover('pointerover', trigger('product'))
    trigger('product').click()

    expect(isOpen('product')).toBe(true)
  })

  test('a touch pointer does not open on hover', () => {
    trigger('product').dispatchEvent(
      new PointerEvent('pointerover', { bubbles: true, pointerType: 'touch' }),
    )

    expect(isOpen('product')).toBe(false)
  })

  test('a new page releases the listeners of the previous one', () => {
    const add = vi.spyOn(document, 'addEventListener')
    setup()
    const signals = add.mock.calls.map(
      ([, , options]) => (options as AddEventListenerOptions).signal,
    )
    setup()

    expect(signals.length).toBeGreaterThan(0)
    expect(signals.every((signal) => signal?.aborted)).toBe(true)
  })
})
