import { classifyLink } from '../lib/linkEvent'
import { trackEvent } from '../lib/track'

const LOADER_SRC = 'https://analytics.progeek.de/a.js?id=O04QUGhRUjN3'
const MIDDLE_BUTTON = 1

// Only the public site is counted. localhost and preview deployments ship the
// same build, so nothing but the runtime hostname can tell them apart.
const TRACKED_HOST = /(^|\.)green-ecolution\.[a-z]{2,}$/

export function isTrackedHost(hostname: string): boolean {
  return TRACKED_HOST.test(hostname)
}

let missedPageView = false

// Guarded: a.js is a third-party script, so an ad blocker or a slow CDN leaves
// window.a undefined and must not take the page down with it.
export function trackPageView() {
  if (!window.a) {
    missedPageView = true
    return
  }
  window.a.pageView()
}

function loadTracker() {
  const script = document.createElement('script')
  script.src = LOADER_SRC
  // a.js only defines window.a, it counts nothing by itself. Injected scripts
  // load async, so the first astro:page-load usually beats it and its page view
  // has to be replayed here.
  script.addEventListener('load', () => {
    if (!missedPageView) return
    missedPageView = false
    trackPageView()
  })
  document.head.append(script)
}

if (isTrackedHost(window.location.hostname)) {
  loadTracker()
}

export function trackLinkClick(event: MouseEvent) {
  if (event.type === 'auxclick' && event.button !== MIDDLE_BUTTON) return
  if (!(event.target instanceof Element)) return
  const link = event.target.closest('a[href]')
  if (!link) return

  const linkEvent = classifyLink(
    link.getAttribute('href') ?? '',
    window.location.href,
    link.hasAttribute('download'),
  )
  if (!linkEvent) return

  const area = link.closest<HTMLElement>('[data-track-area]')?.dataset.trackArea ?? 'content'
  trackEvent(linkEvent.name, { ...linkEvent.props, area })
}

// astro:page-load, not DOMContentLoaded: the ClientRouter swaps the document
// without a full navigation, so DOMContentLoaded would only ever count the
// first page of a visit.
document.addEventListener('astro:page-load', trackPageView)
// On document, which the ClientRouter keeps, so links of every later page count too.
document.addEventListener('click', trackLinkClick)
document.addEventListener('auxclick', trackLinkClick)
