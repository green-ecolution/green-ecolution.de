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

describe('pauseOffscreen', () => {
  beforeEach(() => {
    observers.length = 0
    vi.stubGlobal('IntersectionObserver', FakeObserver)
    document.body.innerHTML = '<section data-pause-offscreen></section><section></section>'
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

  test('releases the previous page on the next page load', async () => {
    await import('./pauseOffscreen')
    document.dispatchEvent(new Event('astro:page-load'))
    document.dispatchEvent(new Event('astro:page-load'))

    expect(observers).toHaveLength(2)
    expect(observers[0].disconnect).toHaveBeenCalled()
    expect(observers[1].disconnect).not.toHaveBeenCalled()
  })
})
