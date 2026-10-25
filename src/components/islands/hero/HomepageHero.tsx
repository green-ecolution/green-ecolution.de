import { Trophy } from 'lucide-react'
import { useT } from '../../../i18n/useT'
import Arrow from '../Arrow'
import HomepageHeroTrees from './HomepageHeroTrees'

function HomepageHero({ language }: { language: string }) {
  const t = useT()

  return (
    <section>
      <div className="overflow-hidden relative mx-auto w-full min-h-svh max-w-screen-3xl pointer-events-none before:bg-background-yellow-dot before:bg-cover before:w-4/5 before:h-[100vh] before:max-h-[45rem] before:absolute before:-right-4 before:bottom-0 before:-z-50 before:bg-no-repeat sm:before:-right-10 md:before:max-h-[70rem] 2xl:before:right-0 2xl:before:bg-contain">
        {/* Organic gradient blob */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 -left-20 w-[40rem] h-[40rem] opacity-30"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(172, 182, 59, 0.4) 0%, transparent 70%)',
              filter: 'blur(60px)',
              transform: 'rotate(-15deg)',
            }}
          />
        </div>

        <article className="pointer-events-auto max-w-208 mx-auto px-4 pt-28 mb-8 md:px-6 lg:mb-14 lg:pt-36 lg:max-w-screen-lg xl:max-w-screen-xl xl:pt-44">
          <div className="max-w-[30rem] 2xl:max-w-[40rem]">
            {/* Animated label */}
            <a
              href={`/${language}/blog/digitalisierungspreis-2026`}
              className="
                hero-rise group inline-flex items-center gap-2 px-3 py-1.5 mb-6
                bg-green-light-100 rounded-full border border-green-light-900/20
                transition-colors hover:border-green-light-900/50
              "
            >
              <Trophy aria-hidden="true" className="w-3.5 h-3.5 shrink-0 text-green-dark-900" />
              <span className="text-xs font-semibold text-green-dark-900 tracking-wide uppercase group-hover:underline">
                {t('hero.badge')}
              </span>
            </a>

            {/* Headline with stagger */}
            <h1
              className="hero-rise font-lato font-bold text-2xl mb-6 text-grey-900 lg:text-4xl xl:text-5xl"
              style={{ '--rise-delay': '150ms' } as React.CSSProperties}
            >
              {t('hero.headlinePrefix')}
              <span className="relative inline-block">
                <span className="relative z-10">{t('hero.headlineHighlight')}</span>
                <span
                  className="hero-underline absolute -bottom-1 left-0 h-3 bg-green-light-900/30 -z-0 rounded-xs"
                  style={{ '--rise-delay': '600ms' } as React.CSSProperties}
                />
              </span>
              {t('hero.headlineSuffix')}
            </h1>

            {/* Motto tagline */}
            <p
              className="hero-rise mb-4 font-lato text-sm tracking-widest uppercase text-green-middle-900 lg:text-base"
              style={{ '--rise-delay': '250ms' } as React.CSSProperties}
            >
              {t('hero.tagline')}
            </p>

            {/* Description with stagger */}
            <p
              className="hero-rise mb-6 text-grey-900/80 leading-relaxed lg:mb-8 lg:text-lg"
              style={{ '--rise-delay': '350ms' } as React.CSSProperties}
            >
              {t('hero.description')}
            </p>

            {/* Buttons with stagger */}
            <div
              className="hero-rise flex flex-wrap items-center gap-3"
              style={{ '--rise-delay': '500ms' } as React.CSSProperties}
            >
              <a
                href={`/${language}/contact`}
                className="
                  flex items-center justify-center gap-x-3 rounded-2xl w-max
                  font-semibold px-6 py-3 group
                  bg-gradient-to-r from-green-dark-900 to-green-middle-900
                  text-white shadow-lg shadow-green-dark-900/25
                  transition-all ease-out duration-200
                  hover:shadow-xl hover:shadow-green-dark-900/30 hover:-translate-y-0.5
                  hover:gap-x-4
                  active:scale-[0.97] active:translate-y-0 active:duration-75
                "
              >
                <span>{t('hero.ctaContact')}</span>
                <Arrow classes="w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href={`/${language}/product`}
                className="
                  flex items-center justify-center rounded-2xl w-max
                  font-semibold px-6 py-3
                  bg-white/70 text-green-dark-900 border border-green-dark-900/30
                  transition-all ease-out duration-200
                  hover:bg-green-light-100 hover:border-green-dark-900/60 hover:-translate-y-0.5
                  active:scale-[0.97] active:translate-y-0 active:duration-75
                "
              >
                {t('hero.ctaProduct')}
              </a>
            </div>
          </div>
        </article>

        <HomepageHeroTrees />
      </div>
    </section>
  )
}

export default HomepageHero
