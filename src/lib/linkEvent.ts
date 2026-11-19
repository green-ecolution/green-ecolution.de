import { company } from '../data/company'

export type EventProps = Record<string, string | number | boolean>

export interface LinkEvent {
  name: string
  props: EventProps
}

const SOCIAL_NETWORKS: Record<string, string> = {
  'instagram.com': 'instagram',
  'linkedin.com': 'linkedin',
  'github.com': 'github',
}

const BOOKING_TYPES: Record<string, string> = {
  [company.booking.overviewUrl]: 'overview',
  [company.booking.introCallUrl]: 'intro_call',
  [company.booking.liveDemoUrl]: 'live_demo',
}

const DEMO_HOST = 'demo.green-ecolution.de'
const DOWNLOAD_EXTENSION = /\.(pdf|zip|png|jpe?g|svg|eps)$/i

const stripWww = (host: string) => host.replace(/^www\./, '')

function withoutTrailingSlash(url: URL): string {
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`
}

// Internal links return null: page views already count where people went.
export function classifyLink(href: string, pageUrl: string, isDownload = false): LinkEvent | null {
  let url: URL
  try {
    url = new URL(href, pageUrl)
  } catch {
    return null
  }

  if (url.protocol === 'mailto:') return { name: 'contact_click', props: { channel: 'email' } }
  if (url.protocol === 'tel:') return { name: 'contact_click', props: { channel: 'phone' } }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

  const host = stripWww(url.hostname.toLowerCase())
  if (host === 'wa.me') return { name: 'contact_click', props: { channel: 'whatsapp' } }
  if (host === 'calendly.com') {
    const type = BOOKING_TYPES[withoutTrailingSlash(url)] ?? 'other'
    return { name: 'booking_click', props: { type } }
  }
  if (host === DEMO_HOST) return { name: 'demo_open', props: {} }

  if (isDownload || DOWNLOAD_EXTENSION.test(url.pathname)) {
    const file = url.pathname.split('/').pop() ?? ''
    return { name: 'download', props: { file } }
  }

  const network = SOCIAL_NETWORKS[host]
  if (network) return { name: 'social_click', props: { network } }

  if (host === stripWww(new URL(pageUrl).hostname.toLowerCase())) return null
  return { name: 'outbound_click', props: { host } }
}
