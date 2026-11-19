// Injected by the analytics.progeek.de client script (a.js), see src/scripts/analytics.ts.
interface Analytics {
  pageView(): void
  // At most 10 flat props, never personal data. The server drops values that look
  // like e-mail addresses or phone numbers.
  trackEvent(eventName: string, props?: Record<string, string | number | boolean>): void
}

interface Window {
  a?: Analytics
  // Written by nginx at serve time, see the Dockerfile.
  _env_?: { VITE_VIDEO_BASE_URL?: string }
}
