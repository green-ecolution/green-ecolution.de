import { TranslationProvider } from '../../../i18n/TranslationProvider'
import StreamletHero from './StreamletHero'

interface Props {
  language: string
  strings: Record<string, string>
}

// One island for the whole cluster: the tank gauge and the 3d tour share a ref,
// and astro cannot nest islands. Three.js stays out of this bundle because the
// tour is a lazy() import.
export default function StreamletHeroIsland({ language, strings }: Props) {
  return (
    <TranslationProvider strings={strings}>
      <StreamletHero language={language} />
    </TranslationProvider>
  )
}
