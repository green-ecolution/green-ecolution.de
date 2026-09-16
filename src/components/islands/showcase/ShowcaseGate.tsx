import { useEffect, useState } from 'react'
import { TranslationProvider } from '../../../i18n/TranslationProvider'
import { SHOWCASE_MEDIA_QUERY } from '../../../lib/showcase/viewport'
import ShowcaseLoop from './ShowcaseLoop'
import ShowcaseTooSmall from './ShowcaseTooSmall'

interface Props {
  strings: Record<string, string>
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
export default function ShowcaseGate({ strings }: Props) {
  const [fits, setFits] = useState(() => window.matchMedia(SHOWCASE_MEDIA_QUERY).matches)
  const [insisted, setInsisted] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(SHOWCASE_MEDIA_QUERY)
    const update = (event: MediaQueryListEvent) => setFits(event.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return (
    <TranslationProvider strings={strings}>
      {fits || insisted ? (
        <ShowcaseLoop />
      ) : (
        <ShowcaseTooSmall onContinue={() => setInsisted(true)} />
      )}
    </TranslationProvider>
  )
}
