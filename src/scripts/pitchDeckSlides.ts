// The slides come from the bucket at runtime, so publishing a new deck there
// updates the press page without a build. `just publish-pitch-deck` in the
// presentations repo writes the manifest read here.

import { pressAssetUrl } from '../lib/pressKit'
import { setup as setupSlideStrips } from './slideStrip'

interface SlideSource {
  width: number
  path: string
}

interface Slide {
  srcset: SlideSource[]
}

export interface PitchDeckManifest {
  version: string
  width: number
  height: number
  slides: Slide[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSlideSource(value: unknown): value is SlideSource {
  return isRecord(value) && typeof value.width === 'number' && typeof value.path === 'string'
}

function isSlide(value: unknown): value is Slide {
  return (
    isRecord(value) &&
    Array.isArray(value.srcset) &&
    value.srcset.length > 0 &&
    value.srcset.every(isSlideSource)
  )
}

export function parseManifest(data: unknown): PitchDeckManifest | null {
  if (
    !isRecord(data) ||
    typeof data.version !== 'string' ||
    typeof data.width !== 'number' ||
    typeof data.height !== 'number' ||
    !Array.isArray(data.slides) ||
    data.slides.length === 0 ||
    !data.slides.every(isSlide)
  ) {
    return null
  }

  return {
    version: data.version,
    width: data.width,
    height: data.height,
    slides: data.slides,
  }
}

export function renderSlides(
  strip: HTMLElement,
  manifest: PitchDeckManifest,
  baseUrl: string,
  sizes: string,
) {
  const items = manifest.slides.map((slide) => {
    const sources = [...slide.srcset].sort((a, b) => a.width - b.width)
    const largest = sources[sources.length - 1]

    const image = document.createElement('img')
    image.src = pressAssetUrl(baseUrl, largest.path)
    image.srcset = sources
      .map((source) => `${pressAssetUrl(baseUrl, source.path)} ${source.width}w`)
      .join(', ')
    image.sizes = sizes
    image.width = manifest.width
    image.height = manifest.height
    image.alt = ''
    image.loading = 'lazy'
    image.decoding = 'async'
    image.className = 'w-full rounded-xl border border-green-dark-900/20'

    const item = document.createElement('li')
    item.dataset.slide = ''
    item.className = 'w-full flex-shrink-0 snap-start'
    item.append(image)
    return item
  })

  strip.replaceChildren(...items)
}

let page: AbortController | null = null

async function load() {
  page?.abort()
  page = new AbortController()
  const { signal } = page

  const preview = document.querySelector<HTMLElement>('[data-pitch-deck-preview]')
  const strip = preview?.querySelector<HTMLElement>('[data-slide-strip]')
  const manifestUrl = preview?.dataset.manifestUrl
  if (!preview || !strip || manifestUrl === undefined) {
    return
  }

  // Server-rendered hidden, so a visitor without javascript only gets the
  // download card instead of a strip that never fills.
  preview.hidden = false

  try {
    const response = await fetch(manifestUrl, { cache: 'no-cache', signal })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const manifest = parseManifest(await response.json())
    if (!manifest) {
      throw new Error('malformed manifest')
    }

    renderSlides(strip, manifest, preview.dataset.assetBase ?? '', preview.dataset.sizes ?? '')

    const readout = preview.querySelector<HTMLElement>(`[data-slide-position="${strip.id}"]`)
    const template = readout?.dataset.template
    if (readout && template) {
      readout.textContent = template
        .replace('{{page}}', '1')
        .replace('{{total}}', String(manifest.slides.length))
    }

    // slideStrip reads the slide count and the readout template on setup, so
    // it has to run again now that both exist.
    setupSlideStrips()
  } catch {
    if (!signal.aborted) {
      preview.hidden = true
    }
  }
}

document.addEventListener('astro:page-load', () => void load())
