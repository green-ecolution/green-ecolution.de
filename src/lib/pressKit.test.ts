import { describe, expect, test } from 'vitest'
import {
  formatDimensions,
  formatFileSize,
  IMAGE_ZIP_BYTES,
  IMAGE_ZIP_PATH,
  LOGO_VARIANTS,
  LOGO_ZIP_PATH,
  PITCH_DECK_PATH,
  PNG_WIDTHS,
  pressAssetUrl,
  PRESS_IMAGES,
  pressImagePath,
} from './pressKit'

describe('pressAssetUrl', () => {
  test('joins base and path', () => {
    expect(pressAssetUrl('https://bucket.example', 'press/logos/a.svg')).toBe(
      'https://bucket.example/press/logos/a.svg',
    )
  })

  test('tolerates a trailing slash on the base', () => {
    expect(pressAssetUrl('https://bucket.example//', 'press/logos/a.svg')).toBe(
      'https://bucket.example/press/logos/a.svg',
    )
  })
})

describe('LOGO_VARIANTS', () => {
  test('offers an SVG and one PNG per configured width for every variant', () => {
    for (const variant of LOGO_VARIANTS) {
      const formats = variant.downloads.map((download) => download.format)
      expect(formats.filter((format) => format === 'svg')).toHaveLength(1)
      expect(formats.filter((format) => format === 'png')).toHaveLength(PNG_WIDTHS.length)
    }
  })

  test('has unique ids and source files', () => {
    expect(new Set(LOGO_VARIANTS.map((variant) => variant.id)).size).toBe(LOGO_VARIANTS.length)
    expect(new Set(LOGO_VARIANTS.map((variant) => variant.file)).size).toBe(LOGO_VARIANTS.length)
  })

  test('keeps every download under the press prefix', () => {
    const paths = [
      ...LOGO_VARIANTS.flatMap((variant) => variant.downloads.map((download) => download.path)),
      LOGO_ZIP_PATH,
      PITCH_DECK_PATH,
    ]
    for (const path of paths) {
      expect(path.startsWith('press/')).toBe(true)
    }
  })
})

describe('PRESS_IMAGES', () => {
  test('has unique ids and source files', () => {
    expect(new Set(PRESS_IMAGES.map((image) => image.id)).size).toBe(PRESS_IMAGES.length)
    expect(new Set(PRESS_IMAGES.map((image) => image.file)).size).toBe(PRESS_IMAGES.length)
  })

  test('keeps every image under the press prefix', () => {
    for (const image of PRESS_IMAGES) {
      expect(pressImagePath(image).startsWith('press/images/')).toBe(true)
    }
    expect(IMAGE_ZIP_PATH.startsWith('press/images/')).toBe(true)
  })

  test('sums the archive size from its members', () => {
    expect(IMAGE_ZIP_BYTES).toBe(PRESS_IMAGES.reduce((total, i) => total + i.bytes, 0))
  })
})

describe('formatDimensions', () => {
  test('writes pixel counts without digit grouping', () => {
    expect(
      formatDimensions({ id: 'team', file: 'a.jpg', width: 6421, height: 4281, bytes: 1 }),
    ).toBe('6421 × 4281 px')
  })
})

describe('formatFileSize', () => {
  test('keeps one decimal below ten megabytes and rounds above', () => {
    expect(formatFileSize(2504004, 'en')).toBe('2.4 MB')
    expect(formatFileSize(27417470, 'en')).toBe('26 MB')
  })

  test('uses the locale decimal separator', () => {
    expect(formatFileSize(2504004, 'de')).toBe('2,4 MB')
  })
})
