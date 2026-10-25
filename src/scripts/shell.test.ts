// @vitest-environment jsdom
import { describe, expect, test, vi } from 'vitest'

function mountShell() {
  document.body.innerHTML = [
    '<div id="scroll-progress"></div>',
    '<header id="site-header" class="bg-white/0"><div id="site-header-blur"></div></header>',
    '<button id="back-to-top"></button>',
    '<a data-lang-switch="en" href="/en"></a>',
  ].join('')
}

describe('shell', () => {
  test('does not bind before astro:page-load fires', async () => {
    mountShell()
    const add = vi.spyOn(window, 'addEventListener')

    await import('./shell')

    expect(add.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(0)
  })

  test('binds window listeners once per page and releases the previous page', async () => {
    mountShell()
    const add = vi.spyOn(window, 'addEventListener')

    await import('./shell')
    document.dispatchEvent(new Event('astro:page-load'))
    document.dispatchEvent(new Event('astro:page-load'))

    const scrollBindings = add.mock.calls.filter(([type]) => type === 'scroll')
    expect(scrollBindings).toHaveLength(2)

    const [first, second] = scrollBindings.map(
      ([, , options]) => (options as AddEventListenerOptions).signal,
    )
    expect(first?.aborted).toBe(true)
    expect(second?.aborted).toBe(false)
  })

  test('keeps the backdrop filter off the header once scrolled', async () => {
    mountShell()
    vi.stubGlobal('scrollY', 400)

    await import('./shell')
    document.dispatchEvent(new Event('astro:page-load'))

    const header = document.getElementById('site-header')!
    const blur = document.getElementById('site-header-blur')!
    expect(header.classList.contains('bg-white/80')).toBe(true)
    expect([...header.classList].some((name) => name.startsWith('backdrop-'))).toBe(false)
    expect(blur.classList.contains('backdrop-blur-xl')).toBe(true)

    vi.unstubAllGlobals()
  })
})
