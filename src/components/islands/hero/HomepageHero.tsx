import { useState, useEffect, useSyncExternalStore } from 'react'
import { useT } from '../../../i18n/useT'
import Arrow from '../Arrow'
import HomepageOverlay from './HomepageOverlay'
import HomepageHeroTrees from './HomepageHeroTrees'
import {
  setInitialLoad as setInitialLoadHelper,
  isInitialLoad as isInitialLoadHelper,
} from '../../../lib/storage'
import { useReducedMotion } from '../../../hooks/useReducedMotion'

function subscribeToStorage(onChange: () => void) {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

function HomepageHero({ language }: { language: string }) {
  const t = useT()
  const [isOverlayVisible, setIsOverlayVisible] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(false)
  const reducedMotion = useReducedMotion()
  // Reading the flag straight from localStorage during render leaves the replay
  // button hidden forever: the server renders without xl:flex, hydration keeps
  // the stale class, and later renders never produce a differing virtual dom.
  const initialLoad = useSyncExternalStore(subscribeToStorage, isInitialLoadHelper, () => true)

  const handleOpenOverlay = () => {
    setIsOverlayVisible(true)
  }

  const handleCloseOverlay = () => {
    setIsOverlayVisible(false)

    if (isInitialLoad) {
      setIsInitialLoad(false)
      setInitialLoadHelper()
    }
  }

  // The overlay is fixed and covers the viewport on its own, so there is no
  // reason to move the reader's scroll position under it.
  const lockScroll = () => document.body.classList.add('overflow-hidden')

  useEffect(() => {
    const handleResize = () => {
      if (window.matchMedia('(max-width: 1279px)').matches) {
        setIsOverlayVisible(false)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (isOverlayVisible) {
      lockScroll()
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [isOverlayVisible])

  useEffect(() => {
    if (
      !isInitialLoadHelper() ||
      isOverlayVisible ||
      !window.matchMedia('(min-width: 1280px)').matches
    ) {
      return
    }

    // Skip animation entirely when reduced motion is preferred
    if (reducedMotion) {
      setInitialLoadHelper()
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- set initial load state
    setIsInitialLoad(true)

    // Someone who has already started scrolling has chosen to read the page
    // rather than watch the intro, and taking the viewport away from them at
    // that point is the one thing the intro must not do. The scroll stays
    // unlocked until the overlay is actually on screen.
    let timer = 0
    const cancel = () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', cancel)
      setIsInitialLoad(false)
      setInitialLoadHelper()
    }

    if (window.scrollY > 0) {
      cancel()
      return
    }

    timer = window.setTimeout(() => {
      window.removeEventListener('scroll', cancel)
      setIsOverlayVisible(true)
    }, 2000)
    window.addEventListener('scroll', cancel, { passive: true })

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', cancel)
    }
  }, [isOverlayVisible, reducedMotion])

  return (
    <section>
      <div className="overflow-hidden relative mx-auto w-full min-h-[calc(100svh-var(--voting-banner-height,0px))] max-w-screen-3xl pointer-events-none before:bg-background-yellow-dot before:bg-cover before:w-4/5 before:h-[100vh] before:max-h-[45rem] before:absolute before:-right-4 before:bottom-0 before:-z-50 before:bg-no-repeat sm:before:-right-10 md:before:max-h-[70rem] 2xl:before:right-0 2xl:before:bg-contain">
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

        <article
          className={`pointer-events-auto max-w-208 mx-auto px-4 pt-28 mb-8 md:px-6 lg:mb-14 lg:pt-36 lg:max-w-screen-lg xl:max-w-screen-xl xl:pt-44
            ${reducedMotion ? '' : 'transition-all duration-500'}
            ${isOverlayVisible ? 'xl:opacity-0 xl:pointer-events-none' : ''}`}
        >
          <div className="max-w-[30rem] 2xl:max-w-[40rem]">
            {/* Animated label */}
            <div
              className="
                hero-rise inline-flex items-center gap-2 px-3 py-1.5 mb-6
                bg-green-light-100 rounded-full border border-green-light-900/20
              "
            >
              <span className="w-2 h-2 bg-green-light-900 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-green-dark-900 tracking-wide uppercase">
                {t('hero.badge')}
              </span>
            </div>

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

            {/* Button with stagger */}
            <div className="hero-rise" style={{ '--rise-delay': '500ms' } as React.CSSProperties}>
              <button
                type="button"
                className={`
                  hidden items-center justify-center gap-x-3 rounded-2xl w-max
                  font-semibold px-6 py-3 group cursor-pointer
                  bg-gradient-to-r from-green-dark-900 to-green-middle-900
                  text-white shadow-lg shadow-green-dark-900/25
                  transition-all ease-out duration-200
                  hover:shadow-xl hover:shadow-green-dark-900/30 hover:-translate-y-0.5
                  hover:gap-x-4
                  active:scale-[0.97] active:translate-y-0 active:duration-75
                  ${!initialLoad && !reducedMotion ? 'xl:flex' : ''}
                `}
                onClick={handleOpenOverlay}
              >
                <span>{t('hero.playAnimation')}</span>
                <Arrow classes="w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </article>

        <HomepageHeroTrees />
      </div>

      <HomepageOverlay
        language={language}
        initialLoad={isInitialLoad}
        isOverlayVisible={isOverlayVisible}
        onClose={handleCloseOverlay}
      />
    </section>
  )
}

export default HomepageHero
