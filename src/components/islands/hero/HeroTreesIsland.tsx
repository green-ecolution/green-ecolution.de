import { TranslationProvider } from '../../../i18n/TranslationProvider'
import HomepageHeroTrees from './HomepageHeroTrees'

interface Props {
  strings: Record<string, string>
}

export default function HeroTreesIsland({ strings }: Props) {
  return (
    <TranslationProvider strings={strings}>
      <HomepageHeroTrees />
    </TranslationProvider>
  )
}
