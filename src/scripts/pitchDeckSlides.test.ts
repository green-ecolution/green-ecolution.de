// @vitest-environment jsdom
import { describe, expect, test } from 'vitest'
import { parseManifest, renderSlides } from './pitchDeckSlides'

const manifest = {
  version: 'abc123',
  width: 1280,
  height: 720,
  slides: [
    {
      srcset: [
        { width: 640, path: 'press/pitch-deck/slides/abc123/slide-01-640.webp' },
        { width: 1280, path: 'press/pitch-deck/slides/abc123/slide-01-1280.webp' },
      ],
    },
    {
      srcset: [{ width: 1280, path: 'press/pitch-deck/slides/abc123/slide-02-1280.webp' }],
    },
  ],
}

describe('parseManifest', () => {
  test('accepts the manifest the publish recipe writes', () => {
    expect(parseManifest(manifest)).toEqual(manifest)
  })

  test('rejects a deck without slides', () => {
    expect(parseManifest({ ...manifest, slides: [] })).toBeNull()
  })

  test('rejects a slide without sources', () => {
    expect(parseManifest({ ...manifest, slides: [{ srcset: [] }] })).toBeNull()
  })

  test('rejects anything that is not a manifest', () => {
    expect(parseManifest(null)).toBeNull()
    expect(parseManifest('slides')).toBeNull()
    expect(parseManifest({ ...manifest, width: '1280' })).toBeNull()
    expect(parseManifest({ ...manifest, slides: [{ srcset: [{ width: 640 }] }] })).toBeNull()
  })
})

describe('renderSlides', () => {
  test('replaces the placeholder with one slide per manifest entry', () => {
    const strip = document.createElement('ol')
    strip.innerHTML = '<li data-slide-placeholder></li>'

    renderSlides(strip, manifest, 'https://bucket.example/', '100vw')

    const slides = strip.querySelectorAll('li[data-slide]')
    expect(slides).toHaveLength(2)
    expect(strip.querySelector('[data-slide-placeholder]')).toBeNull()

    const image = slides[0].querySelector('img')
    expect(image?.getAttribute('src')).toBe(
      'https://bucket.example/press/pitch-deck/slides/abc123/slide-01-1280.webp',
    )
    expect(image?.getAttribute('srcset')).toBe(
      'https://bucket.example/press/pitch-deck/slides/abc123/slide-01-640.webp 640w, ' +
        'https://bucket.example/press/pitch-deck/slides/abc123/slide-01-1280.webp 1280w',
    )
    expect(image?.getAttribute('width')).toBe('1280')
    expect(image?.getAttribute('height')).toBe('720')
    expect(image?.getAttribute('sizes')).toBe('100vw')
  })

  test('resolves paths against an empty base for the dev proxy', () => {
    const strip = document.createElement('ol')

    renderSlides(strip, manifest, '', '100vw')

    expect(strip.querySelectorAll('img')[1].getAttribute('src')).toBe(
      '/press/pitch-deck/slides/abc123/slide-02-1280.webp',
    )
  })
})
