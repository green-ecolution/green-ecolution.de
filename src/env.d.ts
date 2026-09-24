// Injected by the analytics.progeek.de client script (a.js), see src/scripts/analytics.ts.
interface Analytics {
  pageView(): void
  trackEvent(eventName: string, data?: Record<string, unknown>): void
}

interface Window {
  a?: Analytics
  // Written by nginx at serve time, see the Dockerfile.
  _env_?: { VITE_VIDEO_BASE_URL?: string }
  // Releases a run that waits on its first frame, see scripts/render-spot.mjs.
  // Only present while the showcase holds, so the recorder can tell a page that
  // is ready from one that is still loading.
  __showcaseStart?: () => void
}
