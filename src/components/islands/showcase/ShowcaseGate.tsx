import { useEffect, useState } from 'react'
import { TranslationProvider } from '../../../i18n/TranslationProvider'
import { SHOWCASE_MEDIA_QUERY } from '../../../lib/showcase/viewport'
import { showcaseScenes } from '../../../data/showcase'
import { spotScenes } from '../../../data/showcaseSpot'
import ShowcaseLoop from './ShowcaseLoop'
import ShowcaseTooSmall from './ShowcaseTooSmall'

interface Props {
  strings: Record<string, string>
  /** The endless booth board, or the 30-second cut recorded for a wall. */
  variant?: 'booth' | 'spot'
}

// The recorder loads the page with ?hold and releases the run itself once
// ffmpeg is up. A person opening the same address gets a spot that just plays.
function heldForRecording(): boolean {
  return new URLSearchParams(window.location.search).has('hold')
}

/**
 * Decides whether this screen gets the loop at all. The scenes are laid out for
 * one format and never scroll, so on anything smaller they would be cut off
 * rather than merely cramped.
 *
 * The loop stays unmounted behind the hint on purpose: two webgl contexts and a
 * looping video on a phone cost battery and crash tabs for a board nobody can
 * read there anyway. Once the visitor insists, it stays mounted even if the
 * screen keeps failing the check.
 */
export default function ShowcaseGate({ strings, variant = 'booth' }: Props) {
  const [fits, setFits] = useState(() => window.matchMedia(SHOWCASE_MEDIA_QUERY).matches)
  const [insisted, setInsisted] = useState(false)
  const spot = variant === 'spot'
  const [held] = useState(() => spot && heldForRecording())

  useEffect(() => {
    const query = window.matchMedia(SHOWCASE_MEDIA_QUERY)
    const update = (event: MediaQueryListEvent) => setFits(event.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return (
    <TranslationProvider strings={strings}>
      {fits || insisted ? (
        <ShowcaseLoop
          scenes={spot ? spotScenes : showcaseScenes}
          // No scan target on a wall people walk past: the corner code would
          // take the closing card's quiet without anyone standing long enough
          // to use it.
          hideChrome={spot ? ['qr'] : []}
          photoText={spot ? { gap: '0.75rem', bottom: '8rem' } : undefined}
          playback={spot ? { stopAtEnd: true, holdUntilStart: held } : undefined}
        />
      ) : (
        <ShowcaseTooSmall onContinue={() => setInsisted(true)} />
      )}
    </TranslationProvider>
  )
}
