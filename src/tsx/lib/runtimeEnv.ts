// Runtime configuration for the static SPA. Values can be injected at
// serve time via a `window._env_` object (e.g. nginx sub_filter), overridden
// at build time via Vite env, or fall back to a compile-time default.

// Virtual-hosted-style: OVH's S3 endpoint rejects anonymous path-style requests.
const DEFAULT_VIDEO_BASE_URL = 'https://green-ecolution-public-videos.s3.de.io.cloud.ovh.net'

function runtimeEnv(): { VITE_VIDEO_BASE_URL?: string } {
  return window._env_ ?? {}
}

export function videoBaseUrl(): string {
  return (
    runtimeEnv().VITE_VIDEO_BASE_URL ??
    import.meta.env.VITE_VIDEO_BASE_URL ??
    DEFAULT_VIDEO_BASE_URL
  )
}
