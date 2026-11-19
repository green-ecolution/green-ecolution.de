import type { EventProps } from './linkEvent'

// Guarded: a.js is a third-party script, so an ad blocker or a slow CDN leaves
// window.a undefined. Off the public site it is never loaded, so nothing is sent.
export function trackEvent(name: string, props?: EventProps) {
  window.a?.trackEvent(name, props)
}
