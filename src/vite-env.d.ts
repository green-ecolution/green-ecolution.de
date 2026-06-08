/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_APP_VERSION: string
    readonly VITE_BUILD_VERSION: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }

  // Injected by the analytics.progeek.de client script (a.js) in index.html
  interface Analytics {
    pageView(): void
    trackEvent(eventName: string, data?: Record<string, unknown>): void
  }

  interface Window {
    a?: Analytics
  }
}

export {}
