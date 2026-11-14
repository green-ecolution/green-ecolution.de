// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from 'vitest'

type Report = (entries: Pick<IntersectionObserverEntry, 'target' | 'isIntersecting'>[]) => void

const observers: { report: Report; observed: Element[]; disconnect: () => void }[] = []

class FakeObserver {
  observed: Element[] = []
  disconnect = vi.fn()

  constructor(public report: Report) {
    observers.push(this)
  }

  observe(element: Element) {
    this.observed.push(element)
  }
}

const smil = new Map<
  string,
  { pause: ReturnType<typeof vi.fn>; unpause: ReturnType<typeof vi.fn> }
>()

describe('pauseOffscreen', () => {
  beforeEach(() => {
    observers.length = 0
    vi.stubGlobal('IntersectionObserver', FakeObserver)
    document.body.innerHTML = [
      '<section data-pause-offscreen>',
      '<svg id="moving"><circle><animate attributeName="opacity" /></circle></svg>',
      '<svg id="still"><circle /></svg>',
      '</section>',
      '<section></section>',
    ].join('')
    // jsdom has no SMIL.
    for (const svg of document.querySelectorAll('svg')) {
      const calls = { pause: vi.fn(), unpause: vi.fn() }
      svg.pauseAnimations = calls.pause
      svg.unpauseAnimations = calls.unpause
      smil.set(svg.id, calls)
    }
  })

  test('marks a region that left the window and clears the mark when it returns', async () => {
    await import('./pauseOffscreen')
    document.dispatchEvent(new Event('astro:page-load'))

    const region = document.querySelector('[data-pause-offscreen]')!
    const [observer] = observers
    expect(observer.observed).toEqual([region])

    observer.report([{ target: region, isIntersecting: false }])
    expect(region.hasAttribute('data-offscreen')).toBe(true)

    observer.report([{ target: region, isIntersecting: true }])
    expect(region.hasAttribute('data-offscreen')).toBe(false)
  })

  test('pauses the SMIL animations of a region that left the window', async () => {
    await import('./pauseOffscreen')
    document.dispatchEvent(new Event('astro:page-load'))
    const region = document.querySelector('[data-pause-offscreen]')!
    const observer = observers.at(-1)!

    observer.report([{ target: region, isIntersecting: false }])
    expect(smil.get('moving')?.pause).toHaveBeenCalledTimes(1)

    observer.report([{ target: region, isIntersecting: true }])
    expect(smil.get('moving')?.unpause).toHaveBeenCalledTimes(1)
    expect(smil.get('still')?.pause).not.toHaveBeenCalled()
  })

  test('releases the previous page on the next page load', async () => {
    await import('./pauseOffscreen')
    document.dispatchEvent(new Event('astro:page-load'))
    document.dispatchEvent(new Event('astro:page-load'))

    expect(observers).toHaveLength(2)
    expect(observers[0].disconnect).toHaveBeenCalled()
    expect(observers[1].disconnect).not.toHaveBeenCalled()
  })
})
