import { useState } from 'react'
import { Play } from 'lucide-react'
import { trackEvent } from '../../lib/track'

interface Props {
  src: string
  title: string
  posterSrc: string
  posterAlt: string
  playLabel: string
  privacyHint: string
  privacyLinkLabel: string
  privacyLinkHref: string
}

// The iframe is mounted on click, never before: until then not a single request
// reaches the embed provider, so no consent dialog is needed for the page.
//
// The ! utilities are for blog bodies: the unlayered element rules in
// content.css outrank plain utility classes on img and a.
export default function ConsentEmbed({
  src,
  title,
  posterSrc,
  posterAlt,
  playLabel,
  privacyHint,
  privacyLinkLabel,
  privacyLinkHref,
}: Props) {
  const [isAccepted, setIsAccepted] = useState(false)

  return (
    <div className="relative aspect-video w-full bg-grey-900">
      {isAccepted ? (
        <iframe
          src={src}
          title={title}
          allow="fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <>
          <img
            src={posterSrc}
            alt={posterAlt}
            className="absolute inset-0 h-full! w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <button
            type="button"
            onClick={() => {
              setIsAccepted(true)
              trackEvent('embed_play', { provider: new URL(src).hostname.replace(/^www\./, '') })
            }}
            className="group absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 bg-grey-900/40 transition-colors duration-300 hover:bg-grey-900/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-light-900"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform duration-300 group-hover:scale-110">
              <Play className="ml-1 h-7 w-7 text-green-dark-900" fill="currentColor" />
            </span>
            <span className="px-6 text-center font-lato text-sm font-semibold text-white">
              {playLabel}
            </span>
          </button>
          <div className="absolute inset-x-0 bottom-0 z-10 bg-grey-900/75 px-4 py-2 text-center text-xs leading-relaxed text-white/90">
            {privacyHint}{' '}
            <a href={privacyLinkHref} className="text-white! underline">
              {privacyLinkLabel}
            </a>
          </div>
        </>
      )}
    </div>
  )
}
